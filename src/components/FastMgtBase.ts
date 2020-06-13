/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */

import { Providers } from "@microsoft/mgt/dist/es6/Providers";
import { FASTElement, observable } from "@microsoft/fast-element";
import { TemplateHelper } from "@microsoft/mgt";
import {equals} from "@microsoft/mgt/dist/es6/utils/Utils"

/**
 * Defines media query based on component width
 *
 * @export
 * @enum {string}
 */
export enum ComponentMediaQuery {
  /**
   * devices with width < 768
   */
  mobile = "",

  /**
   * devies with width < 1200
   */
  tablet = "tablet",

  /**
   * devices with width > 1200
   */
  desktop = "desktop",
}

/**
 * Lookup for rendered component templates and contexts by slot name.
 */
interface RenderedTemplates {
  [name: string]: {
    /**
     * Reference to the data context used to render the slot.
     */
    context: any;
    /**
     * Reference to the rendered DOM element corresponding to the slot.
     */
    slot: HTMLElement;
  };
}

export interface TemplateContext {
  [prop: string]: any;
}

/**
 * BaseComponent extends LitElement including ShadowRoot toggle and fireCustomEvent features
 *
 * @export  MgtBaseComponent
 * @abstract
 * @class MgtBaseComponent
 * @extends {LitElement}
 */
export abstract class FastMgtBase extends FASTElement {

  /**
   * Additional data context to be used in template binding
   * Use this to add event listeners or value converters
   *
   * @type {TemplateContext}
   * @memberof MgtTemplatedComponent
   */
  public templateContext: TemplateContext;
  
  /**
   * Holds all templates defined by developer
   *
   * @protected
   * @memberof MgtTemplatedComponent
   */
  @observable public templates = {};

  private templatesChanged(oldValue, newValue) {
    console.log(oldValue, newValue);
  }

  private _renderedSlots = false;
  private _renderedTemplates: RenderedTemplates = {};
  private _slotNamesAddedDuringRender = [];

  /**
   * Gets the ComponentMediaQuery of the component
   *
   * @readonly
   * @type {ComponentMediaQuery}
   * @memberof MgtBaseComponent
   */
  public get mediaQuery(): ComponentMediaQuery {
    if (this.offsetWidth < 768) {
      return ComponentMediaQuery.mobile;
    } else if (this.offsetWidth < 1200) {
      return ComponentMediaQuery.tablet;
    } else {
      return ComponentMediaQuery.desktop;
    }
  }

  /**
   * A flag to check if the component is loading data state.
   *
   * @protected
   * @memberof MgtBaseComponent
   */
  public get isLoadingState(): boolean {
    return this._isLoadingState;
  }

  /**
   * A flag to check if the component has updated once.
   *
   * @readonly
   * @protected
   * @type {boolean}
   * @memberof MgtBaseComponent
   */
  protected get isFirstUpdated(): boolean {
    return this._isFirstUpdated;
  }

  /**
   * determines if login component is in loading state
   * @type {boolean}
   */
  @observable private _isLoadingState: boolean = false;

  private _isFirstUpdated = false;
  private _currentLoadStatePromise: Promise<unknown>;

  constructor() {
    super();
    this.templateContext = this.templateContext || {};
    Providers.onProviderUpdated(() => this.requestStateUpdate());
  }

  connectedCallback() {
    super.connectedCallback();
    this._isFirstUpdated = true;

    this.templates = this.getTemplates();
    this._slotNamesAddedDuringRender = [];

    console.log(this.templates);

    this.requestStateUpdate(true);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._isFirstUpdated = false;
  }

  /**
   * load state into the component.
   * Override this function to provide additional loading logic.
   */
  protected loadState(): Promise<void> {
    return Promise.resolve();
  }
    /**
   * Render a <template> by type and return content to render
   *
   * @param templateType type of template (indicated by the data-type attribute)
   * @param context the data context that should be expanded in template
   * @param slotName the slot name that will be used to host the new rendered template. set to a unique value if multiple templates of this type will be rendered. default is templateType
   */
  protected renderTemplate(templateType: string, context: object, slotName?: string) {
    if (!this.hasTemplate(templateType)) {
      return;
    }
    console.log('renderTemplate');

    slotName = slotName || templateType;
    this._slotNamesAddedDuringRender.push(slotName);
    this._renderedSlots = true;

    // const template = html`
    //   <slot name=${slotName}></slot>
    // `;

    if (this._renderedTemplates.hasOwnProperty(slotName)) {
      const { context: existingContext, slot } = this._renderedTemplates[slotName];
      if (equals(existingContext, context)) {
        console.log('it works')
        return;
      }
      this.removeChild(slot);
    }

    const div = document.createElement('div');
    div.slot = slotName;
    div.dataset.generated = 'template';

    TemplateHelper.renderTemplate(div, this.templates[templateType], context, this.templateContext);

    this.appendChild(div);

    this._renderedTemplates[slotName] = { context, slot: div };

    this.fireCustomEvent('templateRendered', { templateType, context, element: div });
  }

  /**
   * helps facilitate creation of events across components
   *
   * @protected
   * @param {string} eventName name given to specific event
   * @param {*} [detail] optional any value to dispatch with event
   * @returns {boolean}
   * @memberof MgtBaseComponent
   */
  protected fireCustomEvent(eventName: string, detail?: any): boolean {
    // TODO: maybe replace with $emit

    const event = new CustomEvent(eventName, {
      bubbles: false,
      cancelable: true,
      detail,
    });
    return this.dispatchEvent(event);
  }

  /**
   * Request to reload the state.
   * Use reload instead of load to ensure loading events are fired.
   *
   * @protected
   * @memberof MgtBaseComponent
   */
  protected async requestStateUpdate(force: boolean = false): Promise<unknown> {
    // the component is still bootstraping - wait until first updated
    if (!this._isFirstUpdated) {
      return;
    }

    // Wait for the current load promise to complete (unless forced).
    if (this.isLoadingState && !force) {
      await this._currentLoadStatePromise;
    }

    const loadStatePromise = new Promise(async (resolve, reject) => {
      try {
        this.setLoadingState(true);
        this.fireCustomEvent("loadingInitiated");

        await this.loadState();

        this.setLoadingState(false);
        this.fireCustomEvent("loadingCompleted");
        resolve();
      } catch (e) {
        this.setLoadingState(false);
        this.fireCustomEvent("loadingFailed");
        reject(e);
      }
    });

    // Return the load state promise.
    // If loading + forced, chain the promises.
    return (this._currentLoadStatePromise =
      this.isLoadingState && !!this._currentLoadStatePromise && force
        ? this._currentLoadStatePromise.then(() => loadStatePromise)
        : loadStatePromise);
  }

  private setLoadingState(value: boolean) {
    if (this._isLoadingState === value) {
      return;
    }

    this._isLoadingState = value;
  }

  /**
   * Check if a specific template has been provided.
   *
   * @protected
   * @param {string} templateName
   * @returns {boolean}
   * @memberof MgtTemplatedComponent
   */
  protected hasTemplate(templateName: string): boolean {
    return this.templates && this.templates[templateName];
  }

  private getTemplates() {
    const templates: any = {};

    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      if (child.nodeName === 'TEMPLATE') {
        const template = child as HTMLElement;
        if (template.dataset.type) {
          templates[template.dataset.type] = template;
        } else {
          templates.default = template;
        }

        (template as any).templateOrder = i;
      }
    }

    return templates;
  }

  private removeUnusedSlottedElements() {
    if (this._renderedSlots) {
      for (let i = 0; i < this.children.length; i++) {
        const child = this.children[i] as HTMLElement;
        if (child.dataset && child.dataset.generated && !this._slotNamesAddedDuringRender.includes(child.slot)) {
          this.removeChild(child);
          delete this._renderedTemplates[child.slot];
          i--;
        }
      }
      this._renderedSlots = false;
    }
  }
}
