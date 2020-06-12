import { html, when } from "@microsoft/fast-element";
import { FluentAvatar } from "./avatar";


export const template = html<FluentAvatar>`
<div class="root">
    ${when(x => !!x.image && x.image.length > 0, 
        html<FluentAvatar>`${x => x.renderImage()}`)}
    ${when(x => !x.image || x.image.length === 0, 
        html<FluentAvatar>`${x => x.renderInitials()}`)}
</div>
`;

export const ImageTemplate = html<FluentAvatar>`
<div class="image">
  <img alt=${x => x.imageAlt} src=${x => x.image} />
</div>
`;

export const InitialsTemplate = html<FluentAvatar>`
<div class="initials">
  <div>
    ${x => x.initials}
  </div>
</div>
`;