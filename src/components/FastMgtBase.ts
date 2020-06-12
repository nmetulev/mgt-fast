/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */

import { Providers } from "@microsoft/mgt/dist/es6/Providers";
import { FASTElement, observable } from "@microsoft/fast-element";

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
 * BaseComponent extends LitElement including ShadowRoot toggle and fireCustomEvent features
 *
 * @export  MgtBaseComponent
 * @abstract
 * @class MgtBaseComponent
 * @extends {LitElement}
 */
export abstract class FastMgtBase extends FASTElement {
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
    Providers.onProviderUpdated(() => this.requestStateUpdate());
  }

  connectedCallback() {
    super.connectedCallback();
    this._isFirstUpdated = true;
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
}
