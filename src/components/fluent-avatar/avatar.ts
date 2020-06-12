import { customElement, FASTElement, attr } from '@microsoft/fast-element';
import { styles } from './avatar-css';
import { template, InitialsTemplate, ImageTemplate } from './avatar-template';

@customElement({name: 'fluent-avatar', template, styles})
export class FluentAvatar extends FASTElement {

  @attr() public image: string;
  @attr() public imageAlt: string;
  @attr() public initials: string;

  public renderImage() {
    return ImageTemplate;
  }

  public renderInitials() {
    return InitialsTemplate;
  }
}