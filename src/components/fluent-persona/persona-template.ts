import {html, when} from '@microsoft/fast-element';
import { FluentPersona } from './persona';
import { PersonaSize, AvatarBackground } from './persona-types';

export const template = html<FluentPersona>`
<div class="root">
  <div class="avatar ${x => PersonaSize[x.size]} ${x => AvatarBackground[x.avatarBackground]}">
    ${x => x.renderAvatar()}
  </div>
  <div class="details ${x => PersonaSize[x.size]}">
    ${x => x.renderDetails()}
  </div>
</div>
`; 

export const AvatarTemplate = html<FluentPersona>`
<fluent-avatar :image=${x => x.image} :initials=${x => x.initials} :imageAlt=${x => x.imageAlt}></fluent-avatar>
`;

export const DetailsTemplate = html<FluentPersona>`
${x => x.renderText()}
${x => x.renderSecondaryText()}
${x => x.renderTertiaryText()}
${x => x.renderOptionalText()}
`

export const TextTemplate = html<FluentPersona>`
    <div class="primaryText">
        <div>${x => x.text}</div>
    </div>
`;

export const SecondaryTextTemplate = html<FluentPersona>`
    ${when(x => x.size >= PersonaSize.size40, html<FluentPersona>`
        <div class="secondaryText">
            <div>${x => x.secondaryText}</div>
        </div>
    `)}
`;

export const TertiaryTextTemplate = html<FluentPersona>`
    ${when(x => x.size >= PersonaSize.size72, html<FluentPersona>`
        <div class="secondaryText">
            <div>${x => x.tertiaryText}</div>
        </div>
    `)}
`;

export const OptionalTextTemplate = html<FluentPersona>`
    ${when(x => x.size >= PersonaSize.size100, html<FluentPersona>`
        <div class="secondaryText">
            <div>${x => x.optionalText}</div>
        </div>
    `)}
`;