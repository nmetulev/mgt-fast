import { html, when } from "@microsoft/fast-element";
import { MgtFastPerson, PersonViewType } from "./mgt-fast-person";
import { getEmailFromGraphEntity } from "@microsoft/mgt/dist/es6/graph/graph.people";

export const template = html<MgtFastPerson>`
  ${x => {
    if (x.isLoadingState && !x.personDetails) {
      return x.renderLoading();
    } else if (!x.personDetails && !x.getImage()) {
      return x.renderNoData();
    } else if (x.templates['default']) {
      return html`<slot name="default"></slot>`;
    }

    return rootTemplate;
  }}
`;

const rootTemplate = html<MgtFastPerson>`
<div
  class="root"
  @click=${(x, c) => x.handleMouseClick(c.event as MouseEvent)}
  @mouseenter=${(x, c) => x.handleMouseEnter(c.event as MouseEvent)}
  @mouseleave=${(x, c) => x.handleMouseLeave(c.event as MouseEvent)}
>
  <div class="person-root">
    ${(x) => x.renderImage()} ${(x) => x.renderDetails()}
  </div>
</div>
`;

export const loadingTemplate = html<MgtFastPerson>`
${x => {
  if (x.templates['loading']) {
    return html`<slot name="loading"></slot>`
  } else return null;
}}`;

export const noDataTemplate = html<MgtFastPerson>`
${x => {
  if (x.templates['no-data']) {
    return html`<slot name="no-data"></slot>`;
  } else {
    return html<MgtFastPerson>`<i :className="avatar-icon ms-Icon ms-Icon--Contact ${(x) =>
      x.isLargeAvatar() ? "small" : ""}"></i>`;
  }
}}`
;

export const imageTemplate = html<MgtFastPerson>`
<div :className="user-avatar ${(x) =>
  !x.getImage() || x._isInvalidImageSrc ? "initials" : ""} ${(x) =>
  !x.isLargeAvatar() ? "small" : ""} ${(x) => x._personAvatarBg}"
    title=${(x) =>
      x.personDetails.displayName ||
      getEmailFromGraphEntity(x.personDetails) ||
      ""}
    aria-label=${(x) =>
      x.personDetails.displayName ||
      getEmailFromGraphEntity(x.personDetails) ||
      ""}>
  ${when(
    (x) => x.getImage() && !x._isInvalidImageSrc,
    html<MgtFastPerson>`
      <img
        alt=${(x) =>
          x.personDetails.displayName ||
          getEmailFromGraphEntity(x.personDetails) ||
          ""}
        src=${(x) => x.getImage()}
        @error=${(x) => () => (x._isInvalidImageSrc = true)}
      />
    `
  )}
  ${when(
    (x) => (!x.getImage() || x._isInvalidImageSrc) && x.personDetails,
    html<MgtFastPerson>`
      <span
        class="initials-text"
        aria-label="${(x) => x.getInitials(x.personDetails)}"
      >
        ${(x) =>
          x.getInitials(x.personDetails)
            ? x.getInitials(x.personDetails)
            : html<MgtFastPerson>`
                <i class="ms-Icon ms-Icon--Contact contact-icon"></i>
              `}
      </span>
    `
  )}
  </div>
`;

export const detailsTemplate = html<MgtFastPerson>`
  ${when(
    (x) => x.personDetails && x.view !== PersonViewType.avatar,
    html<MgtFastPerson>`
      <div :className="details ${(x) => (x.isLargeAvatar() ? "small" : "")}">
        ${when(
          (x) => x.view > PersonViewType.avatar,
          html<MgtFastPerson>`
            <div class="line1">
              ${(x) => x.getTextFromProperty(x.personDetails, x.line1Property)}
            </div>
          `
        )}
        ${when(
          (x) => x.view > PersonViewType.oneline,
          html<MgtFastPerson>`
            <div class="line2">
              ${(x) => x.getTextFromProperty(x.personDetails, x.line2Property)}
            </div>
          `
        )}
      </div>
    `
  )}
`;
