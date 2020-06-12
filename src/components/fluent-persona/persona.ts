import { customElement, FASTElement, attr } from '@microsoft/fast-element';
import { styles } from './persona-css';
import { PersonaSize, AvatarBackground } from './persona-types';
import '../fluent-avatar/avatar';
import { template, OptionalTextTemplate, TertiaryTextTemplate, SecondaryTextTemplate, TextTemplate, AvatarTemplate, DetailsTemplate } from './persona-template';

@customElement({name: 'fluent-persona', template, styles})
export class FluentPersona extends FASTElement {
  /**
   * Array of styles to apply to the element. The styles should be defined
   * using the `css` tag function.
   */
  static get styles() {
    return styles;
  }

  @attr() public image: string;
  @attr() public imageAlt: string;
  @attr() public initials: string;
  @attr() public text: string;
  @attr() public secondaryText: string;
  @attr() public tertiaryText: string;
  @attr() public optionalText: string;

  @attr({
    converter: {
    fromView: value => {
        if (!value || value.length === 0) {
            return AvatarBackground.green10;
        }
    
        if (typeof AvatarBackground[value] === 'undefined') {
            return AvatarBackground.green10;
        } else {
            return AvatarBackground[value];
        }
    },
    
    toView: (value: AvatarBackground) => {
        return value.toString();
    }
  }})
  public avatarBackground: AvatarBackground = AvatarBackground.green10;

  @attr({
    converter: {
        fromView: value => {
      if (!value || value.length === 0) {
        return PersonaSize.size32;
      }

      if (typeof PersonaSize[value] === 'undefined') {
        return PersonaSize.size32;
      } else {
        return PersonaSize[value];
      }
    },
    toView: (value: PersonaSize) => {
        return value.toString();
    }
  }})
  public size: PersonaSize = PersonaSize.size32;

  public renderAvatar() {
    return AvatarTemplate;
  }

  public renderDetails() {
    return DetailsTemplate;
  }

  public renderText() {
    return TextTemplate;
  }

  public renderSecondaryText() {
    return SecondaryTextTemplate;
  }

  public renderTertiaryText() {
    return TertiaryTextTemplate;
  }

  public renderOptionalText() {
    return OptionalTextTemplate;
  }
}
