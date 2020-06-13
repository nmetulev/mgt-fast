import { html, when, TemplateValue, repeat } from "@microsoft/fast-element";
import { MgtFastAgenda } from "./mgt-fast-agenda";

import "../mgt-fast-person/mgt-fast-person";
import "@microsoft/mgt/dist/es6/components/mgt-people/mgt-people";

const a = (s, ...v: TemplateValue<MgtFastAgenda>[]) =>
  html<MgtFastAgenda>(s, ...v);
const e = (s, ...v) => html<microsoftgraph.Event>(s, ...v);

const renderSlot = (source, dataType, defaultTemplate) => {
  if (source[dataType]) {
    return html`<slot name="${dataType}"></slot>`;
  } else {
    return defaultTemplate;
  }
};

export const template = a`
<div>
${(x) => {
  if (!x.events && x.isLoadingState) {
    return renderSlot(x, "loading", x.renderLoading());
  }

  console.log("events", x.events);
  if (!x.events || x.events.length === 0) {
    return renderSlot(x, "no-data", x.renderNoData());
  }

  return renderSlot(x, "default", a`<div>${(x) => x.renderGroups()}</div>`);
}}
${when(
  (x) => x.events,
  html`<div>${(x) => x.events[0].subject}</div>
    <span>the hell</span>`
)}
  </div>
  `;

export const loadingTemplate = a`
<div class="event">
    <div class="event-time-container">
    <div class="event-time-loading loading-element"></div>
    </div>
    <div class="event-details-container">
    <div class="event-subject-loading loading-element"></div>
    <div class="event-location-container">
        <div class="event-location-icon-loading loading-element"></div>
        <div class="event-location-loading loading-element"></div>
    </div>
    <div class="event-location-container">
        <div class="event-attendee-loading loading-element"></div>
        <div class="event-attendee-loading loading-element"></div>
        <div class="event-attendee-loading loading-element"></div>
    </div>
    </div>
</div>
`;

export const noDataTemplate = a`<div></div>`;

export const headerTemplate = html`
  ${(x, c) => {
    if (c.parent.templates["header"]) {
      return html`<slot name="header-${(x) => x.header}"></slot>`;
    }

    return e`
    <div class="header" aria-label=${(x) => x.header}>${(x) => x.header}</div>
    `;
  }}
`;

export const eventTitleTemplate = e`
<div class="event-subject">${(x) => x.subject}</div>
`;

export const eventLocationTemplate = e`
${when(
  (x) => x.location.displayName,
  e`
<div class="event-location-container">
    <svg width="10" height="13" viewBox="0 0 10 13" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M4.99989 6.49989C4.15159 6.49989 3.46143 5.81458 3.46143 4.97224C3.46143 4.12965 4.15159 3.44434 4.99989 3.44434C5.84845 3.44434 6.53835 4.12965 6.53835 4.97224C6.53835 5.81458 5.84845 6.49989 4.99989 6.49989Z"
        stroke="black"
    />
    <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M8.1897 7.57436L5.00029 12L1.80577 7.56765C0.5971 6.01895 0.770299 3.47507 2.17681 2.12383C2.93098 1.39918 3.93367 1 5.00029 1C6.06692 1 7.06961 1.39918 7.82401 2.12383C9.23075 3.47507 9.40372 6.01895 8.1897 7.57436Z"
        stroke="black"
    />
    </svg>
    <div class="event-location" aria-label="${(x) =>
      x.location.displayName}">${(x) => x.location.displayName}</div>
</div>
`
)}`;

export const eventAttendeesTemplate = e`
${when(
  (x) => x.attendees.length,
  e`
<mgt-people
    class="event-attendees"
    :peopleQueries=${(x) =>
      x.attendees.map((attendee) => {
        return attendee.emailAddress.address;
      })}
></mgt-people>
`
)}`;

export const eventOtherTemplate = e`
${(x) => {
  if (x.templates["event-other"]) {
    return html`<slot name="${"TODO"}-other"></slot>`;
  }

  return null;
}}
`;

export const groupsTemplate = html`
  <div>Groups</div>
  ${repeat(
    (x) => x._groups,
    html`
      <div class="group">
        ${(x, c) => c.parent.renderHeader()}
      </div>
    `
  )}
`;
