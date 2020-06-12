import {FASTElement, customElement, attr, html} from '@microsoft/fast-element';
import {styles} from './fast-test-css'

const template = html<FastTest>`
    <div class="root">
        Hello <span>${x => x.name}</span>
    </div>
`;

@customElement({name: 'fast-test', template, styles})
export class FastTest extends FASTElement {
    @attr name: string = "";

    private nameChanged() {
        console.log('name changed, ', this.name);
    }
}