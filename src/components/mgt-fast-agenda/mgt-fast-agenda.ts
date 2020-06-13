/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */

import * as MicrosoftGraph from "@microsoft/microsoft-graph-types";
import { Providers } from "@microsoft/mgt/dist/es6/Providers";
import { ProviderState } from "@microsoft/mgt/dist/es6/providers/IProvider";
import { prepScopes } from "@microsoft/mgt/dist/es6/utils/GraphHelpers";
import {
  getDayOfWeekString,
  getMonthString,
} from "@microsoft/mgt/dist/es6/utils/Utils";
import { getEventsPageIterator } from "@microsoft/mgt/dist/es6/components/mgt-agenda/mgt-agenda.graph";

import { customElement, attr, observable } from "@microsoft/fast-element";

import { styles } from "./mgt-fast-agenda-css";
import {
  template,
  loadingTemplate,
  noDataTemplate,
  headerTemplate,
  eventTitleTemplate,
  eventLocationTemplate,
  eventAttendeesTemplate,
  eventOtherTemplate,
  groupsTemplate,
} from "./mgt-fast-agenda-template";
import { FastMgtBase } from "../FastMgtBase";

/**
 * Web Component which represents events in a user or group calendar.
 *
 * @export
 * @class MgtAgenda
 * @extends {MgtTemplatedComponent}
 *
 * @fires eventClick - Fired when user click an event
 *
 * @cssprop --event-box-shadow - {String} Event box shadow color and size
 * @cssprop --event-margin - {String} Event margin
 * @cssprop --event-padding - {String} Event padding
 * @cssprop --event-background - {Color} Event background color
 * @cssprop --event-border - {String} Event border color
 * @cssprop --agenda-header-margin - {String} Agenda header margin size
 * @cssprop --agenda-header-font-size - {Length} Agenda header font size
 * @cssprop --agenda-header-color - {Color} Agenda header color
 * @cssprop --event-time-font-size - {Length} Event time font size
 * @cssprop --event-time-color - {Color} Event time color
 * @cssprop --event-subject-font-size - {Length} Event subject font size
 * @cssprop --event-subject-color - {Color} Event subject color
 * @cssprop --event-location-font-size - {Length} Event location font size
 * @cssprop --event-location-color - {Color} Event location color
 */
@customElement({ name: "mgt-fast-agenda", styles, template })
export class MgtFastAgenda extends FastMgtBase {
  /**
   * stores current date for initial calender selection in events.
   * @type {string}
   */
  @attr public date: string;

  private dateChanged() {
    console.log("dateChanged");
    this.reloadState();
  }

  /**
   * determines if agenda events come from specific group
   * @type {string}
   */
  @attr({ attribute: "group-id" }) public groupId: string;

  private groupIdChanged() {
    this.reloadState();
  }

  /**
   * sets number of days until end date, 3 is the default
   * @type {number}
   */
  @attr() public days: number;

  private daysChanged() {
    this.reloadState();
  }

  /**
   * allows developer to specify a different graph query that retrieves events
   * @type {string}
   */
  @attr({ attribute: "event-query" }) public eventQuery: string;

  private eventQueryChanged() {
    this.reloadState();
  }

  /**
   * array containing events from user agenda.
   * @type {Array<MicrosoftGraph.Event>}
   */
  @observable public events: MicrosoftGraph.Event[];

  eventsChanged(oldValue, newValue) {
    console.log(oldValue, newValue, this.events);
  }

  /**
   * allows developer to define max number of events shown
   * @type {number}
   */
  @attr({ attribute: "show-max" }) public showMax: number;

  /**
   * allows developer to define agenda to group events by day.
   * @type {boolean}
   */
  @attr({
    attribute: "group-by-day",
    mode: "boolean",
  })
  public groupByDay: boolean;

  /**
   * determines width available for agenda component.
   * @type {boolean}
   * @internal
   */
  @observable public _isNarrow: boolean;

  /** @internal */
  @observable public _groups: {
    header: string;
    events: MicrosoftGraph.Event[];
  }[];

  /** @internal */
  @observable public _events: MicrosoftGraph.Event[];

  constructor() {
    super();
    this.days = 3;
    this.onResize = this.onResize.bind(this);
  }

  /**
   * Determines width available if resize is necessary, adds onResize event listener to window
   *
   * @memberof MgtAgenda
   */
  public connectedCallback() {
    this._isNarrow = this.offsetWidth < 600;
    super.connectedCallback();
    window.addEventListener("resize", this.onResize);
  }

  /**
   * Removes onResize event listener from window
   *
   * @memberof MgtAgenda
   */
  public disconnectedCallback() {
    window.removeEventListener("resize", this.onResize);
    super.disconnectedCallback();
  }

  /**
   * Invoked on each update to perform rendering tasks. This method must return a lit-html TemplateResult.
   * Setting properties inside this method will not trigger the element to update
   *
   * @returns
   * @memberof MgtAgenda
   */
  //   public render(): TemplateResult {
  //     // Loading
  //     if (!this.events && this.isLoadingState) {
  //       return this.renderLoading();
  //     }

  //     // No data
  //     if (!this.events || this.events.length === 0) {
  //       return this.renderNoData();
  //     }

  //     // Prep data
  //     const events = this.showMax && this.showMax > 0 ? this.events.slice(0, this.showMax) : this.events;

  //     // Default template
  //     const renderedTemplate = this.renderTemplate('default', { events });
  //     if (renderedTemplate) {
  //       return renderedTemplate;
  //     }

  //     // Update narrow state
  //     this._isNarrow = this.offsetWidth < 600;

  //     // Render list
  //     return html`
  //       <div class="agenda${this._isNarrow ? ' narrow' : ''}${this.groupByDay ? ' grouped' : ''}">
  //         ${this.groupByDay ? this.renderGroups(events) : this.renderEvents(events)}
  //         ${this.isLoadingState ? this.renderLoading() : html``}
  //       </div>
  //     `;
  //   }

  /**
   * Render the loading state
   *
   * @protected
   * @returns
   * @memberof MgtAgenda
   */
  public renderLoading() {
    return loadingTemplate;
  }

  /**
   * Render the no-data state.
   *
   * @protected
   * @returns {TemplateResult}
   * @memberof MgtAgenda
   */
  public renderNoData() {
    return noDataTemplate;
  }

  /**
   * Render an individual Event.
   *
   * @protected
   * @param {MicrosoftGraph.Event} event
   * @returns
   * @memberof MgtAgenda
   */
  //   protected renderEvent(event: MicrosoftGraph.Event): TemplateResult {
  //     return html`
  //       <div class="event">
  //         <div class="event-time-container">
  //           <div
  //             class="event-time"
  //             aria-label="${this.getEventTimeString(event)}"
  //           >
  //             ${this.getEventTimeString(event)}
  //           </div>
  //         </div>
  //         <div class="event-details-container">
  //           ${this.renderTitle(event)} ${this.renderLocation(event)}
  //           ${this.renderAttendees(event)}
  //         </div>
  //         <div class="event-other-container">
  //           ${this.renderOther(event)}
  //         </div>
  //       </div>
  //     `;
  //     // <div class="event-duration">${this.getEventDuration(event)}</div>
  //   }

  /**
   * Render the header for a group.
   * Only relevant for grouped Events.
   *
   * @protected
   * @param {Date} date
   * @returns
   * @memberof MgtAgenda
   */
  public renderHeader() {
    return headerTemplate;
  }

  /**
   * Render the title field of an Event
   *
   * @protected
   * @param {MicrosoftGraph.Event} event
   * @returns
   * @memberof MgtAgenda
   */
  protected renderTitle() {
    return eventTitleTemplate;
  }

  /**
   * Render the location field of an Event
   *
   * @protected
   * @param {MicrosoftGraph.Event} event
   * @returns
   * @memberof MgtAgenda
   */
  public renderLocation() {
    return eventLocationTemplate;
  }

  /**
   * Render the attendees field of an Event
   *
   * @protected
   * @param {MicrosoftGraph.Event} event
   * @returns
   * @memberof MgtAgenda
   */
  public renderAttendees() {
    return eventAttendeesTemplate;
  }

  /**
   * Render the event other field of an Event
   *
   * @protected
   * @param {MicrosoftGraph.Event} event
   * @returns
   * @memberof MgtAgenda
   */
  public renderOther() {
    return eventOtherTemplate;
  }

  /**
   * Render the events in groups, each with a header.
   *
   * @protected
   * @param {MicrosoftGraph.Event[]} events
   * @returns {TemplateResult}
   * @memberof MgtAgenda
   */
  public renderGroups() {
    console.log("wtf");
    return groupsTemplate;
  }

  /**
   * Render a list of events.
   *
   * @protected
   * @param {MicrosoftGraph.Event[]} events
   * @returns {TemplateResult}
   * @memberof MgtAgenda
   */
  //   protected renderEvents(events: MicrosoftGraph.Event[]): TemplateResult {
  //     return html`
  //       <ul class="agenda-list">
  //         ${events.map(
  //           (event) =>
  //             html`
  //               <li @click=${() => this.eventClicked(event)}>
  //                 ${this.renderTemplate("event", { event }, event.id) ||
  //                 this.renderEvent(event)}
  //               </li>
  //             `
  //         )}
  //       </ul>
  //     `;
  //   }

  /**
   * Load state into the component
   *
   * @protected
   * @returns
   * @memberof MgtAgenda
   */
  protected async loadState() {
    if (this.events) {
      return;
    }

    const p = Providers.globalProvider;
    if (p && p.state === ProviderState.SignedIn) {
      const graph = p.graph.forComponent(this);

      if (this.eventQuery) {
        try {
          const tokens = this.eventQuery.split("|");
          let scope: string;
          let query: string;
          if (tokens.length > 1) {
            query = tokens[0].trim();
            scope = tokens[1].trim();
          } else {
            query = this.eventQuery;
          }

          let request = await graph.api(query);

          if (scope) {
            request = request.middlewareOptions(prepScopes(scope));
          }

          const results = await request.get();

          if (results && results.value) {
            this.events = results.value;
          }
          // tslint:disable-next-line: no-empty
        } catch (e) {}
      } else {
        const start = this.date ? new Date(this.date) : new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date(start.getTime());
        end.setDate(start.getDate() + this.days);
        try {
          const iterator = await getEventsPageIterator(
            graph,
            start,
            end,
            this.groupId
          );

          if (iterator && iterator.value) {
            this.events = iterator.value;

            while (iterator.hasNext) {
              await iterator.next();
              this.events = iterator.value;
            }
          }
        } catch (error) {
          // noop - possible error with graph
        }
      }

      if (this.events) {
        if (this.groupByDay) {
          const groups = new Map<string, MicrosoftGraph.Event[]>();

          this.events.forEach((event) => {
            const header = this.getDateHeaderFromDateTimeString(
              event.start.dateTime
            );
            groups.set(header, groups.get(header) || []);
            groups.get(header).push(event);
          });

          this._groups = Array.from(groups, ([header, events]) => ({
            header,
            events,
          }));
          this._events = null;

          console.log(this._groups);
        } else {
          this._events =
            this.showMax && this.showMax > 0
              ? this.events.slice(0, this.showMax)
              : this.events;
          this._groups = null;
        }
      }
    }
  }

  private async reloadState() {
    this.events = null;
    this.requestStateUpdate(true);
  }

  private onResize() {
    this._isNarrow = this.offsetWidth < 600;
  }

  private eventClicked(event: MicrosoftGraph.Event) {
    this.fireCustomEvent("eventClick", { event });
  }

  private getEventTimeString(event: MicrosoftGraph.Event) {
    if (event.isAllDay) {
      return "ALL DAY";
    }

    const start = this.prettyPrintTimeFromDateTime(
      new Date(event.start.dateTime)
    );
    const end = this.prettyPrintTimeFromDateTime(new Date(event.end.dateTime));

    return `${start} - ${end}`;
  }

  private prettyPrintTimeFromDateTime(date: Date) {
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? "0" + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  }

  private getDateHeaderFromDateTimeString(dateTimeString: string) {
    const date = new Date(dateTimeString);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

    const dayIndex = date.getDay();
    const monthIndex = date.getMonth();
    const day = date.getDate();
    const year = date.getFullYear();

    return `${getDayOfWeekString(dayIndex)}, ${getMonthString(
      monthIndex
    )} ${day}, ${year}`;
  }

  private getEventDuration(event: MicrosoftGraph.Event) {
    let dtStart = new Date(event.start.dateTime);
    const dtEnd = new Date(event.end.dateTime);
    const dtNow = new Date();
    let result: string = "";

    if (dtNow > dtStart) {
      dtStart = dtNow;
    }

    const diff = dtEnd.getTime() - dtStart.getTime();
    const durationMinutes = Math.round(diff / 60000);

    if (durationMinutes > 1440 || event.isAllDay) {
      result = Math.ceil(durationMinutes / 1440) + "d";
    } else if (durationMinutes > 60) {
      result = Math.round(durationMinutes / 60) + "h";
      const leftoverMinutes = durationMinutes % 60;
      if (leftoverMinutes) {
        result += leftoverMinutes + "m";
      }
    } else {
      result = durationMinutes + "m";
    }

    return result;
  }
}
