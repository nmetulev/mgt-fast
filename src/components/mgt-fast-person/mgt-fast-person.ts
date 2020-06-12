/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */

import { customElement, attr, observable } from "@microsoft/fast-element";
import * as MicrosoftGraph from "@microsoft/microsoft-graph-types";

import {
  findPeople,
  getEmailFromGraphEntity,
} from "@microsoft/mgt/dist/es6/graph/graph.people";
import { getPersonImage } from "@microsoft/mgt/dist/es6/graph/graph.photos";
import { getUserWithPhoto } from "@microsoft/mgt/dist/es6/graph/graph.user";
import {
  AvatarSize,
  IDynamicPerson,
  Providers,
  ProviderState,
} from "@microsoft/mgt";

import { FastMgtBase } from "../FastMgtBase";
import { styles } from "./mgt-fast-person-css";
import {
  template,
  loadingTemplate,
  noDataTemplate,
  detailsTemplate,
  imageTemplate,
} from "./mgt-fast-person-template";

/**
 * Enumeration to define what parts of the person component render
 *
 * @export
 * @enum {number}
 */
export enum PersonViewType {
  /**
   * Render only the avatar
   */
  avatar = 2,

  /**
   * Render the avatar and one line of text
   */
  oneline = 3,

  /**
   * Render the avatar and two lines of text
   */
  twolines = 4,
}

/**
 * The person component is used to display a person or contact by using their photo, name, and/or email address.
 *
 * @export
 * @class MgtPerson
 * @extends {MgtTemplatedComponent}
 *
 * @cssprop --avatar-size - {Length} Avatar size
 * @cssprop --avatar-border - {String} Avatar border
 * @cssprop --avatar-border-radius - {String} Avatar border radius
 * @cssprop --initials-color - {Color} Initials color
 * @cssprop --initials-background-color - {Color} Initials background color
 * @cssprop --font-family - {String} Font family
 * @cssprop --font-size - {Length} Font size
 * @cssprop --font-weight - {Length} Font weight
 * @cssprop --color - {Color} Color
 * @cssprop --text-transform - {String} text transform
 * @cssprop --line2-font-size - {Length} Line 2 font size
 * @cssprop --line2-font-weight - {Length} Line 2 font weight
 * @cssprop --line2-color - {Color} Line 2 color
 * @cssprop --line2-text-transform - {String} Line 2 text transform
 * @cssprop --details-spacing - {Length} spacing between avatar and person details
 */
@customElement({ name: "mgt-fast-person", template, styles })
export class MgtFastPerson extends FastMgtBase {
  /**
   * Array of styles to apply to the element. The styles should be defined
   * user the `css` tag function.
   */
  static get styles() {
    return styles;
  }

  /**
   * allows developer to define name of person for component
   * @type {string}
   */
  @attr({
    attribute: "person-query",
  })
  public personQuery: string;

  /**
   * user-id property allows developer to use id value to determine person
   * @type {string}
   */
  @attr({
    attribute: "user-id",
  })
  public userId: string;

  /**
   * determines person component avatar size and apply presence badge accordingly
   * @type {AvatarSize}
   */
  @attr({
    attribute: "avatar-size",
  })
  public avatarSize: AvatarSize;

  /**
   * object containing Graph details on person
   * @type {IDynamicPerson}
   */
  @observable public personDetails: IDynamicPerson;

  private personDetailsChanged(
    oldValue: IDynamicPerson,
    newValue: IDynamicPerson
  ) {
    if (oldValue === newValue) {
      console.log("value is the same");
      return;
    }

    if (newValue && newValue.displayName) {
      this._personAvatarBg = this.getColorFromName(newValue.displayName);
    } else {
      this._personAvatarBg = "gray20";
    }

    this._fetchedImage = null;
    this.requestStateUpdate();
  }

  /**
   * Set the image of the person
   *
   * @type {string}
   * @memberof MgtPersonCard
   */
  @attr({
    attribute: "person-image",
  })
  public personImage: string;

  private personImageChanged(oldValue: string, newValue: string) {
    if (oldValue === newValue) {
      console.log("value is the same");
      return;
    }

    this._isInvalidImageSrc = !newValue;
  }

  /**
   * Sets whether the person image should be fetched
   * from the Microsoft Graph based on the personDetails
   * provided by the user
   *
   * @type {boolean}
   * @memberof MgtPerson
   */
  @attr({
    attribute: "fetch-image",
    mode: "boolean",
  })
  public fetchImage: boolean;

  /**
   * Sets the property of the personDetails to use for the first line of text.
   * Default is displayName.
   *
   * @type {string}
   * @memberof MgtPerson
   */
  @attr({ attribute: "line1-property" }) public line1Property: string;

  /**
   * Sets the property of the personDetails to use for the second line of text.
   * Default is mail.
   *
   * @type {string}
   * @memberof MgtPerson
   */
  @attr({ attribute: "line2-property" }) public line2Property: string;

  /**
   * Sets what data to be rendered (avatar only, oneLine, twoLines).
   * Default is 'avatar'.
   *
   * @type {PersonViewType}
   * @memberof MgtPerson
   */
  @attr({
    converter: {
      fromView: (value: string) => {
        if (!value || value.length === 0) {
          return PersonViewType.avatar;
        }
        console.log(value);

        // value = value.toLowerCase();

        if (typeof PersonViewType[value] === "undefined") {
          return PersonViewType.avatar;
        } else {
          return PersonViewType[value];
        }
      },
      toView: (value: PersonViewType) => {
        return PersonViewType[value];
      },
    },
    mode: "reflect",
  })
  public view: PersonViewType;

  /** @internal */
  @observable public _fetchedImage: string;

  /** @internal */
  @observable public _isInvalidImageSrc: boolean;

  /** @internal */
  @observable public _personAvatarBg: string;

  private _mouseLeaveTimeout;
  private _mouseEnterTimeout;

  constructor() {
    super();

    // defaults
    this.line1Property = "displayName";
    this.line2Property = "email";
    this.view = PersonViewType.avatar;
    this.avatarSize = "auto";
    this._isInvalidImageSrc = false;
  }

  // /**
  //  * Synchronizes property values when attributes change.
  //  *
  //  * @param {*} name
  //  * @param {*} oldValue
  //  * @param {*} newValue
  //  * @memberof MgtPerson
  //  */
  // public attributeChangedCallback(name, oldval, newval) {
  //   super.attributeChangedCallback(name, oldval, newval);

  //   // TODO: this should be a property changed callback most likely
  //   if (oldval === newval) {
  //     return;
  //   }

  //   switch (name) {
  //     case "person-query":
  //     case "user-id":
  //       this.personDetails = null;
  //       this.requestStateUpdate();
  //       break;
  //   }
  // }

  /**
   * Render the loading state
   *
   * @protected
   * @returns {TemplateResult}
   * @memberof MgtPerson
   */
  public renderLoading() {
    return loadingTemplate; // this.renderTemplate("loading", null) || html``;
  }

  /**
   * Render the state when no data is available
   *
   * @protected
   * @returns {TemplateResult}
   * @memberof MgtPerson
   */
  public renderNoData() {
    // const noDataTemplate = this.renderTemplate("no-data", null);
    // if (noDataTemplate) {
    //   return noDataTemplate;
    // }

    return noDataTemplate;
  }

  /**
   * Render the image part of the person template.
   * If the image is unavailable, the person's initials will be used instead.
   *
   * @protected
   * @param {string} [imageSrc]
   * @param {IDynamicPerson} [personDetails]
   * @returns
   * @memberof MgtPerson
   */
  public renderImage() {
    return imageTemplate;
  }

  /**
   * Render the details part of the person template.
   *
   * @protected
   * @param {IDynamicPerson} [person]
   * @param {string} [image]
   * @returns {TemplateResult}
   * @memberof MgtPerson
   */
  public renderDetails() {
    return detailsTemplate;
  }

  /**
   * load state into the component.
   *
   * @protected
   * @returns
   * @memberof MgtPerson
   */
  protected async loadState() {
    const provider = Providers.globalProvider;
    if (!provider || provider.state === ProviderState.Loading) {
      return;
    }

    if (provider.state === ProviderState.SignedOut) {
      this.personDetails = null;
      return;
    }

    const graph = provider.graph.forComponent(this);

    if (this.personDetails) {
      if (
        !this.personDetails.personImage &&
        ((this.fetchImage && !this.personImage && !this._fetchedImage) ||
          this.personImage === "@")
      ) {
        const image = await getPersonImage(graph, this.personDetails);
        if (image) {
          this.personDetails.personImage = image;
          this._fetchedImage = image;
        }
      }
    } else if (this.userId || this.personQuery === "me") {
      // Use userId or 'me' query to get the person and image
      const person = await getUserWithPhoto(graph, this.userId);

      this.personDetails = person;
      this._fetchedImage = this.getImage();
    } else if (this.personQuery) {
      // Use the personQuery to find our person.
      const people = await findPeople(graph, this.personQuery, 1);

      if (people && people.length) {
        this.personDetails = people[0];
        const image = await getPersonImage(graph, people[0]);

        if (image) {
          this.personDetails.personImage = image;
          this._fetchedImage = image;
        }
      }
    }
  }

  /** @internal */
  public getImage(): string {
    if (this.personImage && this.personImage !== "@") {
      return this.personImage;
    }

    if (this._fetchedImage) {
      return this._fetchedImage;
    }

    const person = this.personDetails;
    return person && person.personImage ? person.personImage : null;
  }

  /** @internal */
  public getInitials(person?: IDynamicPerson) {
    if (!person) {
      person = this.personDetails;
    }

    if ((person as MicrosoftGraph.Contact).initials) {
      return (person as MicrosoftGraph.Contact).initials;
    }

    let initials = "";
    if (person.givenName) {
      initials += person.givenName[0].toUpperCase();
    }
    if (person.surname) {
      initials += person.surname[0].toUpperCase();
    }

    if (!initials && person.displayName) {
      const name = person.displayName.split(/\s+/);
      for (let i = 0; i < 2 && i < name.length; i++) {
        if (name[i][0] && this.isLetter(name[i][0])) {
          initials += name[i][0].toUpperCase();
        }
      }
    }

    return initials;
  }

  private isLetter(char: string) {
    try {
      return char.match(new RegExp("\\p{L}", "u"));
    } catch (e) {
      return char.toLowerCase() !== char.toUpperCase();
    }
  }

  /** @internal */
  public getTextFromProperty(personDetails: IDynamicPerson, prop: string) {
    if (!prop || prop.length === 0) {
      return null;
    }

    const properties = prop.trim().split(",");
    let text;
    let i = 0;

    while (!text && i < properties.length) {
      const currentProp = properties[i].trim();
      switch (currentProp) {
        case "mail":
        case "email":
          text = getEmailFromGraphEntity(personDetails);
          break;
        default:
          text = personDetails[currentProp];
      }
      i++;
    }

    return text;
  }

  //** @internal */
  public isLargeAvatar() {
    return (
      this.avatarSize === "large" ||
      (this.avatarSize === "auto" && this.view > PersonViewType.oneline)
    );
  }

  /** @internal */
  public handleMouseClick(e: MouseEvent) {
    console.log("mouse click");
  }

  /** @internal */
  public handleMouseEnter(e: MouseEvent) {
    clearTimeout(this._mouseEnterTimeout);
    clearTimeout(this._mouseLeaveTimeout);
    console.log("mouse enter");
  }

  /** @internal */
  public handleMouseLeave(e: MouseEvent) {
    clearTimeout(this._mouseEnterTimeout);
    clearTimeout(this._mouseLeaveTimeout);
    console.log("mouse exit");
  }

  private getColorFromName(name) {
    const charCodes = name
      .split("")
      .map((char) => char.charCodeAt(0))
      .join("");
    const nameInt = parseInt(charCodes, 10);
    const colors = [
      "pinkRed10",
      "red20",
      "red10",
      "orange20",
      "orangeYellow20",
      "green10",
      "green20",
      "cyan20",
      "cyan30",
      "cyanBlue10",
      "cyanBlue20",
      "blue10",
      "blueMagenta30",
      "blueMagenta20",
      "magenta20",
      "magenta10",
      "magentaPink10",
      "orange30",
      "gray30",
      "gray20",
    ];
    return colors[nameInt % colors.length];
  }
}
