import './chosen-sprite.png';
import './chosen-sprite@2x.png';
import './chosen.css';

const escapeHtml = (unsafe: string) => {
    return unsafe
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
};

function getParent(e: Element, selector: string) {
    for (let p = e && e.parentElement; p; p = p.parentElement) {
        if (p.matches(selector)) {
            return p;
        }
    }
}

function prevAll(element: Element, selector: string) {
    const result = [];

    let e: Element | null = element;

    while (e.previousElementSibling) {
        e = e.previousElementSibling;
        if (e.matches(selector)) {
            result.push(e);
        }
    }
    return result;
}

function nextAll(element: Element, selector: string) {
    const result = [];

    let e: Element | null = element;

    while (e.nextElementSibling) {
        e = e.nextElementSibling;
        if (e.matches(selector)) {
            result.push(e);
        }
    }
    return result;
}

interface ChosenEventInit extends EventInit {
    chosen: AbstractChosen;
}

class ChosenEvent extends Event {
    chosen: AbstractChosen | undefined;

    constructor(type: string, eventInitDict?: ChosenEventInit | undefined) {
        super(type, eventInitDict);
        this.chosen = eventInitDict?.chosen;
    }
}

type SelectParserGroupItem = {
    array_index: number;
    group: boolean;
    label: string;
    title?: string;
    children: number;
    disabled: boolean;
    classes: string;
    search_match?: boolean;
    highlighted_html?: string;
    group_match?: boolean;
    active_options?: number;
};

type SelectParserOptionItem = {
    array_index: number;
    options_index: number;
    value?: string;
    text?: string;
    html?: string;
    title?: string;
    selected?: boolean;
    disabled?: boolean;
    group_array_index?: number;
    group_label?: string | null;
    classes?: string;
    style?: string;
    empty?: boolean;
    search_match?: boolean;
    highlighted_html?: string;
    group_match?: boolean;
    active_options?: number;
};

type SelectParserItem = SelectParserGroupItem | SelectParserOptionItem;

class SelectParser {
    options_index = 0;
    parsed: SelectParserItem[] = [];

    add_node(child: Node): void {
        if (child.nodeName.toUpperCase() === 'OPTGROUP') {
            this.add_group(child as HTMLOptGroupElement);
        } else {
            this.add_option(child);
        }
    }

    add_group(group: HTMLOptGroupElement): void {
        const group_position = this.parsed.length;
        this.parsed.push({
            array_index: group_position,
            group: true,
            label: group.label,
            title: group.title ? group.title : undefined,
            children: 0,
            disabled: group.disabled,
            classes: group.className,
        });
        for (const option of group.childNodes) {
            this.add_option(option, group_position, group.disabled);
        }
    }

    add_option(option: Node, group_position?: number, group_disabled?: boolean): void {
        if (option.nodeName.toUpperCase() === 'OPTION' && option instanceof HTMLOptionElement) {
            if (option.text !== '') {
                if (group_position != null) {
                    const item = this.parsed[group_position] as SelectParserGroupItem;
                    if (item.children) {
                        item.children += 1;
                    }
                }
                this.parsed.push({
                    array_index: this.parsed.length,
                    options_index: this.options_index,
                    value: option.value,
                    text: option.text,
                    html: option.innerHTML,
                    title: option.title ? option.title : undefined,
                    selected: option.selected,
                    disabled: group_disabled === true ? group_disabled : option.disabled,
                    group_array_index: group_position,
                    group_label:
                        group_position != null
                            ? (this.parsed[group_position] as SelectParserGroupItem).label
                            : null,
                    classes: option.className,
                    style: option.style.cssText,
                });
            } else {
                this.parsed.push({
                    array_index: this.parsed.length,
                    options_index: this.options_index,
                    empty: true,
                });
            }
            this.options_index += 1;
        }
    }

    static select_to_array(select: HTMLSelectElement): SelectParserItem[] {
        const parser = new SelectParser();
        for (const child of select.childNodes) {
            parser.add_node(child);
        }
        return parser.parsed;
    }
}

interface ChosenOptions {
    allow_single_deselect?: boolean;
    disable_search?: boolean;
    disable_search_threshold?: number;
    enable_split_word_search?: boolean;
    inherit_select_classes?: boolean;
    max_selected_options?: number;
    no_results_text?: string;
    placeholder_text_multiple?: string;
    placeholder_text_single?: string;
    placeholder_text?: string;
    search_contains?: boolean;
    group_search?: boolean;
    single_backstroke_delete?: boolean;
    width?: string;
    display_disabled_options?: boolean;
    display_selected_options?: boolean;
    include_group_label_in_selected?: boolean;
    max_shown_results?: number;
    case_sensitive_search?: boolean;
    hide_results_on_select?: boolean;
    rtl?: boolean;
}

abstract class AbstractChosen {
    form_field: HTMLSelectElement;
    options: ChosenOptions;
    is_multiple: boolean;
    default_text: string;
    results_none_found: string;
    include_group_label_in_selected: boolean;
    mouse_on_container: boolean;
    active_field: boolean;
    results_data: SelectParserItem[];
    max_shown_results: number;
    results_showing: boolean;
    group_search: boolean;
    search_contains: boolean;
    enable_split_word_search: boolean;
    case_sensitive_search: boolean;
    selected_option_count: number | null;
    is_disabled = false;
    backstroke_length: number;
    pending_backstroke: Element | null;
    disable_search: boolean;
    display_selected_options: boolean;
    display_disabled_options: boolean;
    touch_started: boolean;
    is_rtl: boolean;
    allow_single_deselect: boolean;
    disable_search_threshold: number;
    single_backstroke_delete: boolean;
    max_selected_options: number;
    inherit_select_classes: boolean;
    hide_results_on_select: boolean;

    click_test_action: (evt: MouseEvent) => void;
    activate_action: (evt: Event) => void;

    static default_multiple_text = 'Select Some Options';
    static default_single_text = 'Select an Option';
    static default_no_result_text = 'No results match';

    constructor(form_field: HTMLSelectElement, options: ChosenOptions) {
        this.form_field = form_field;
        this.options = options != null ? options : {};
        if (!AbstractChosen.browser_is_supported()) {
            return;
        }
        this.is_multiple = this.form_field.multiple;
        this.set_default_text();
        this.set_default_values();
        this.setup();
        this.set_up_html();
        this.register_observers();
        this.on_ready();
    }

    set_default_values(): void {
        this.click_test_action = (evt: MouseEvent) => {
            this.test_active_click(evt);
        };
        this.activate_action = (evt: Event) => {
            this.activate_field();
        };
        this.active_field = false;
        this.mouse_on_container = false;
        this.results_showing = false;
        this.is_rtl = this.options.rtl || /\bchosen-rtl\b/.test(this.form_field.className);
        this.allow_single_deselect =
            this.options.allow_single_deselect != null &&
            this.form_field.options[0] != null &&
            this.form_field.options[0].text === ''
                ? this.options.allow_single_deselect
                : false;
        this.disable_search_threshold = this.options.disable_search_threshold || 0;
        this.disable_search = this.options.disable_search || false;
        this.enable_split_word_search =
            this.options.enable_split_word_search != null
                ? this.options.enable_split_word_search
                : true;
        this.group_search = this.options.group_search != null ? this.options.group_search : true;
        this.search_contains = this.options.search_contains || false;
        this.single_backstroke_delete =
            this.options.single_backstroke_delete != null
                ? this.options.single_backstroke_delete
                : true;
        this.max_selected_options = this.options.max_selected_options || Infinity;
        this.inherit_select_classes = this.options.inherit_select_classes || false;
        this.display_selected_options =
            this.options.display_selected_options != null
                ? this.options.display_selected_options
                : true;
        this.display_disabled_options =
            this.options.display_disabled_options != null
                ? this.options.display_disabled_options
                : true;
        this.include_group_label_in_selected =
            this.options.include_group_label_in_selected || false;
        this.max_shown_results = this.options.max_shown_results || Number.POSITIVE_INFINITY;
        this.case_sensitive_search = this.options.case_sensitive_search || false;
        this.hide_results_on_select =
            this.options.hide_results_on_select != null
                ? this.options.hide_results_on_select
                : true;
    }

    set_default_text(): void {
        const placeholder = this.form_field.dataset.placeholder;
        if (placeholder) {
            this.default_text = placeholder;
        } else if (this.is_multiple) {
            this.default_text =
                this.options.placeholder_text_multiple ||
                this.options.placeholder_text ||
                AbstractChosen.default_multiple_text;
        } else {
            this.default_text =
                this.options.placeholder_text_single ||
                this.options.placeholder_text ||
                AbstractChosen.default_single_text;
        }
        this.results_none_found =
            this.form_field.getAttribute('data-no_results_text') ||
            this.options.no_results_text ||
            AbstractChosen.default_no_result_text;
    }

    choice_label(item: SelectParserOptionItem): string {
        if (this.include_group_label_in_selected && item.group_label != null) {
            return "<b class='group-name'>" + escapeHtml(item.group_label) + '</b>' + item.html;
        } else {
            return item.html as string;
        }
    }

    mouse_enter(): void {
        this.mouse_on_container = true;
    }

    mouse_leave(): void {
        this.mouse_on_container = false;
    }

    input_focus(): void {
        if (this.is_multiple) {
            if (!this.active_field) {
                setTimeout(() => {
                    this.container_mousedown();
                }, 50);
            }
        } else {
            if (!this.active_field) {
                this.activate_field();
            }
        }
    }

    input_blur(evt: FocusEvent): void {
        if (!this.mouse_on_container) {
            this.active_field = false;
            setTimeout(() => {
                this.blur_test();
            }, 100);
        }
    }

    label_click_handler(evt: MouseEvent): void {
        if (this.is_multiple) {
            this.container_mousedown(evt);
        } else {
            this.activate_field();
        }
    }

    results_option_build(first: boolean = false): string {
        let content = '';
        let shown_results = 0;
        for (const data of this.results_data) {
            let data_content = '';
            if ((data as SelectParserGroupItem).group) {
                data_content = this.result_add_group(data as SelectParserGroupItem);
            } else {
                data_content = this.result_add_option(data as SelectParserOptionItem);
            }
            if (data_content !== '') {
                shown_results++;
                content += data_content;
            }
            if (first) {
                if ((data as SelectParserOptionItem).selected && this.is_multiple) {
                    this.choice_build(data as SelectParserOptionItem);
                } else if ((data as SelectParserOptionItem).selected && !this.is_multiple) {
                    this.single_set_selected_text(
                        this.choice_label(data as SelectParserOptionItem),
                    );
                }
            }
            if (shown_results >= this.max_shown_results) {
                break;
            }
        }
        return content;
    }

    result_add_option(option: SelectParserOptionItem): string {
        if (!option.search_match) {
            return '';
        }
        if (!this.include_option_in_results(option)) {
            return '';
        }
        const classes = [];
        if (!option.disabled && !(option.selected && this.is_multiple)) {
            classes.push('active-result');
        }
        if (option.disabled && !(option.selected && this.is_multiple)) {
            classes.push('disabled-result');
        }
        if (option.selected) {
            classes.push('result-selected');
        }
        if (option.group_array_index != null) {
            classes.push('group-option');
        }
        if (option.classes !== '') {
            classes.push(option.classes);
        }
        const option_el = document.createElement('li');
        option_el.className = classes.join(' ');
        if (option.style) {
            option_el.style.cssText = option.style;
        }
        option_el.dataset.optionArrayIndex = option.array_index.toString();
        option_el.innerHTML = (option.highlighted_html || option.html) as string;
        if (option.title) {
            option_el.title = option.title;
        }
        return this.outerHTML(option_el);
    }

    result_add_group(group: SelectParserGroupItem): string {
        if (!(group.search_match || group.group_match)) {
            return '';
        }
        if (!(group.active_options !== undefined && group.active_options > 0)) {
            return '';
        }
        const classes = [];
        classes.push('group-result');
        if (group.classes) {
            classes.push(group.classes);
        }
        const group_el = document.createElement('li');
        group_el.className = classes.join(' ');
        group_el.innerHTML = group.highlighted_html || escapeHtml(group.label as string);
        if (group.title) {
            group_el.title = group.title;
        }
        return this.outerHTML(group_el);
    }

    results_update_field(): void {
        this.set_default_text();
        if (!this.is_multiple) {
            this.results_reset_cleanup();
        }
        this.result_clear_highlight();
        this.results_build();
        if (this.results_showing) {
            this.winnow_results();
        }
    }

    reset_single_select_options(): void {
        for (const result of this.results_data) {
            if ((result as SelectParserOptionItem).selected) {
                (result as SelectParserOptionItem).selected = false;
            }
        }
    }

    results_toggle(): void {
        if (this.results_showing) {
            this.results_hide();
        } else {
            this.results_show();
        }
    }

    results_search(): void {
        if (this.results_showing) {
            this.winnow_results();
        } else {
            this.results_show();
        }
    }

    winnow_results(skip_highlight: boolean = false): void {
        this.no_results_clear();
        let results = 0;
        const query = this.get_search_text();
        const escapedQuery = query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
        const regex = this.get_search_regex(escapedQuery);
        for (const option of this.results_data) {
            option.search_match = false;
            let results_group = null;
            let search_match = null;
            option.highlighted_html = '';
            if (this.include_option_in_results(option)) {
                if ((option as SelectParserGroupItem).group) {
                    option.group_match = false;
                    option.active_options = 0;
                }
                if (
                    (option as SelectParserOptionItem).group_array_index !== undefined &&
                    this.results_data[
                        (option as SelectParserOptionItem).group_array_index as number
                    ]
                ) {
                    results_group =
                        this.results_data[
                            (option as SelectParserOptionItem).group_array_index as number
                        ];
                    if (results_group.active_options === 0 && results_group.search_match) {
                        results += 1;
                    }
                    if (results_group.active_options !== undefined) {
                        results_group.active_options += 1;
                    }
                }
                const text: string = (
                    (option as SelectParserGroupItem).group
                        ? (option as SelectParserGroupItem).label
                        : (option as SelectParserOptionItem).text
                ) as string;
                if (!((option as SelectParserGroupItem).group && !this.group_search)) {
                    search_match = this.search_string_match(text, regex);
                    option.search_match = search_match != null;
                    if (option.search_match && !(option as SelectParserGroupItem).group) {
                        results += 1;
                    }
                    if (option.search_match) {
                        if (query.length) {
                            const startpos = search_match!.index;
                            const prefix = text.slice(0, startpos);
                            const fix = text.slice(startpos, startpos + query.length);
                            const suffix = text.slice(startpos + query.length);
                            option.highlighted_html =
                                escapeHtml(prefix) +
                                '<em>' +
                                escapeHtml(fix) +
                                '</em>' +
                                escapeHtml(suffix);
                        }
                        if (results_group != null) {
                            results_group.group_match = true;
                        }
                    } else if (
                        (option as SelectParserOptionItem).group_array_index !== undefined &&
                        this.results_data[
                            (option as SelectParserOptionItem).group_array_index as number
                        ].search_match
                    ) {
                        option.search_match = true;
                    }
                }
            }
        }
        this.result_clear_highlight();
        if (results < 1 && query.length) {
            this.update_results_content('');
            this.no_results(query);
        } else {
            this.update_results_content(this.results_option_build());
            if (!skip_highlight) {
                this.winnow_results_set_highlight();
            }
        }
    }

    get_search_regex(escaped_search_string: string): RegExp {
        let regex_string = this.search_contains
            ? escaped_search_string
            : '(^|\\s|\\b)' + escaped_search_string + '[^\\s]*';
        if (!(this.enable_split_word_search || this.search_contains)) {
            regex_string = '^' + regex_string;
        }
        const regex_flag = this.case_sensitive_search ? '' : 'i';
        return new RegExp(regex_string, regex_flag);
    }

    search_string_match(search_string: string, regex: RegExp): RegExpExecArray | null {
        const match = regex.exec(search_string);
        if (!this.search_contains && (match != null ? match[1] : void 0)) {
            match!.index += 1;
        }
        return match;
    }

    choices_count(): number {
        if (this.selected_option_count != null) {
            return this.selected_option_count;
        }
        this.selected_option_count = 0;
        for (const option of this.form_field.options) {
            if (option.selected) {
                this.selected_option_count += 1;
            }
        }
        return this.selected_option_count;
    }

    choices_click(evt: MouseEvent): void {
        evt.preventDefault();
        this.activate_field();
        if (!(this.results_showing || this.is_disabled)) {
            this.results_show();
        }
    }

    keydown_checker(evt: KeyboardEvent): void {
        const ref = evt.which;
        const stroke = ref != null ? ref : evt.keyCode;
        this.search_field_scale();
        if (stroke !== 8 && this.pending_backstroke) {
            this.clear_backstroke();
        }
        switch (stroke) {
            case 8:
                this.backstroke_length = this.get_search_field_value().length;
                break;
            case 9:
                if (this.results_showing && !this.is_multiple) {
                    this.result_select(evt);
                }
                this.mouse_on_container = false;
                break;
            case 13:
                if (this.results_showing) {
                    evt.preventDefault();
                }
                break;
            case 27:
                if (this.results_showing) {
                    evt.preventDefault();
                }
                break;
            case 32:
                if (this.disable_search) {
                    evt.preventDefault();
                }
                break;
            case 38:
                evt.preventDefault();
                this.keyup_arrow();
                break;
            case 40:
                evt.preventDefault();
                this.keydown_arrow();
                break;
        }
    }

    keyup_checker(evt: KeyboardEvent): void {
        const ref = evt.which;
        const stroke = ref != null ? ref : evt.keyCode;
        this.search_field_scale();
        switch (stroke) {
            case 8:
                if (this.is_multiple && this.backstroke_length < 1 && this.choices_count() > 0) {
                    this.keydown_backstroke();
                } else if (!this.pending_backstroke) {
                    this.result_clear_highlight();
                    this.results_search();
                }
                break;
            case 13:
                evt.preventDefault();
                if (this.results_showing) {
                    this.result_select(evt);
                }
                break;
            case 27:
                if (this.results_showing) {
                    this.results_hide();
                }
                break;
            case 9:
            case 16:
            case 17:
            case 18:
            case 38:
            case 40:
            case 91:
                break;
            default:
                this.results_search();
                break;
        }
    }

    clipboard_event_checker(evt: ClipboardEvent): void {
        if (this.is_disabled) {
            return;
        }
        setTimeout(() => {
            this.results_search();
        }, 50);
    }

    container_width(): string {
        if (this.options.width != null) {
            return this.options.width;
        } else {
            return this.form_field.offsetWidth + 'px';
        }
    }

    include_option_in_results(option: SelectParserItem): boolean {
        if (
            this.is_multiple &&
            !this.display_selected_options &&
            (option as SelectParserOptionItem).selected
        ) {
            return false;
        }
        if (!this.display_disabled_options && option.disabled) {
            return false;
        }
        if ((option as SelectParserOptionItem).empty) {
            return false;
        }
        return true;
    }

    search_results_touchstart(evt: TouchEvent): void {
        this.touch_started = true;
        this.search_results_mouseover(evt);
    }

    search_results_touchmove(evt: TouchEvent): void {
        this.touch_started = false;
        this.search_results_mouseout(evt);
    }

    search_results_touchend(evt: TouchEvent): void {
        if (this.touch_started) {
            this.search_results_mouseup(evt);
        }
    }

    outerHTML(element: HTMLElement): string {
        if (element.outerHTML) {
            return element.outerHTML;
        }
        const tmp = document.createElement('div');
        tmp.appendChild(element);
        return tmp.innerHTML;
    }

    get_single_children(): Node {
        const fragment = new DocumentFragment();

        const link = document.createElement('a');
        link.className = 'chosen-single chosen-default';

        const span = document.createElement('span');
        span.innerText = this.default_text;
        link.appendChild(span);

        const wrapper = document.createElement('div');
        const b = document.createElement('b');
        wrapper.appendChild(b);
        link.appendChild(wrapper);

        const chosen_drop = document.createElement('div');
        chosen_drop.className = 'chosen-drop';

        const chosen_search = document.createElement('div');
        chosen_search.className = 'chosen-search';

        const chosen_search_input = document.createElement('input');
        chosen_search_input.className = 'chosen-search-input';
        chosen_search_input.type = 'text';
        chosen_search_input.autocomplete = 'off';
        chosen_search.appendChild(chosen_search_input);
        chosen_drop.appendChild(chosen_search);

        const chosen_results = document.createElement('ul');
        chosen_results.className = 'chosen-results';
        chosen_drop.appendChild(chosen_results);

        fragment.appendChild(link);
        fragment.appendChild(chosen_drop);
        return fragment;
    }

    get_multi_children(): Node {
        const fragment = new DocumentFragment();

        const chosen_choices = document.createElement('ul');
        chosen_choices.className = 'chosen-choices';
        fragment.appendChild(chosen_choices);

        const search_field = document.createElement('li');
        search_field.className = 'search-field';
        chosen_choices.appendChild(search_field);

        const chosen_search_input = document.createElement('input');
        chosen_search_input.className = 'chosen-search-input';
        chosen_search_input.type = 'text';
        chosen_search_input.autocomplete = 'off';
        chosen_search_input.value = this.default_text;
        search_field.appendChild(chosen_search_input);

        const chosen_drop = document.createElement('div');
        chosen_drop.className = 'chosen-drop';
        fragment.appendChild(chosen_drop);

        const chosen_results = document.createElement('ul');
        chosen_results.className = 'chosen-results';
        chosen_drop.appendChild(chosen_results);

        return fragment;
    }

    get_no_results_html(terms: string): string {
        return (
            '<li class="no-results">\n  ' +
            this.results_none_found +
            ' <span>' +
            escapeHtml(terms) +
            '</span>\n</li>'
        );
    }

    static browser_is_supported() {
        if (
            /iP(od|hone)/i.test(window.navigator.userAgent) ||
            /IEMobile/i.test(window.navigator.userAgent) ||
            /Windows Phone/i.test(window.navigator.userAgent) ||
            /BlackBerry/i.test(window.navigator.userAgent) ||
            /BB10/i.test(window.navigator.userAgent) ||
            /Android.*Mobile/i.test(window.navigator.userAgent)
        ) {
            return false;
        }
        return true;
    }

    abstract setup(): void;
    abstract set_up_html(): void;
    abstract register_observers(): void;
    abstract on_ready(): void;
    abstract test_active_click(evt: MouseEvent): void;
    abstract activate_field(): void;
    abstract container_mousedown(evt?: UIEvent): void;
    abstract blur_test(): void;
    abstract choice_build(item: SelectParserOptionItem): void;
    abstract single_set_selected_text(text?: string): void;
    abstract results_reset_cleanup(): void;
    abstract result_clear_highlight(): void;
    abstract results_build(): void;
    abstract results_hide(): void;
    abstract results_show(): void;
    abstract no_results_clear(): void;
    abstract get_search_text(): string;
    abstract update_results_content(content: string): void;
    abstract no_results(terms: string): void;
    abstract winnow_results_set_highlight(): void;
    abstract search_field_scale(): void;
    abstract clear_backstroke(): void;
    abstract get_search_field_value(): string;
    abstract result_select(evt: UIEvent): void;
    abstract keyup_arrow(): void;
    abstract keydown_arrow(): void;
    abstract keydown_backstroke(): void;
    abstract search_results_mouseover(evt: UIEvent): void;
    abstract search_results_mouseout(evt: UIEvent): void;
    abstract search_results_mouseup(evt: UIEvent): void;
}

export default class Chosen extends AbstractChosen {
    current_selectedIndex: number;
    container: HTMLDivElement;
    dropdown: HTMLElement;
    search_field: HTMLInputElement;
    search_results: HTMLElement;
    search_no_results: HTMLElement;
    search_choices: HTMLElement;
    search_container: HTMLElement;
    selected_item: HTMLElement;
    parsing: boolean;
    result_highlight: HTMLElement | null;
    form_field_label: HTMLLabelElement;

    setup(): void {
        this.current_selectedIndex = this.form_field.selectedIndex;
    }

    set_up_html(): void {
        const container_classes = ['chosen-container'];
        container_classes.push('chosen-container-' + (this.is_multiple ? 'multi' : 'single'));
        if (this.inherit_select_classes && this.form_field.className) {
            container_classes.push(this.form_field.className);
        }
        if (this.is_rtl) {
            container_classes.push('chosen-rtl');
        }
        this.container = document.createElement('div');
        this.container.className = container_classes.join(' ');
        this.container.title = this.form_field.title;
        if (this.form_field.id.length) {
            this.container.id = this.form_field.id.replace(/[^\w]/g, '_') + '_chosen';
        }
        this.container.style.width = this.container_width();
        if (this.is_multiple) {
            this.container.appendChild(this.get_multi_children());
        } else {
            this.container.appendChild(this.get_single_children());
        }
        this.form_field.style.display = 'none';
        this.form_field.parentNode?.insertBefore(
            this.container,
            this.form_field.nextElementSibling,
        );
        this.dropdown = this.container.querySelector('div.chosen-drop') as HTMLElement;
        this.search_field = this.container.querySelector('input') as HTMLInputElement;
        this.search_results = this.container.querySelector('ul.chosen-results') as HTMLElement;
        this.search_field_scale();
        this.search_no_results = this.container.querySelector('li.no-results') as HTMLElement;
        if (this.is_multiple) {
            this.search_choices = this.container.querySelector('ul.chosen-choices') as HTMLElement;
            this.search_container = this.container.querySelector('li.search-field') as HTMLElement;
        } else {
            this.search_container = this.container.querySelector(
                'div.chosen-search',
            ) as HTMLElement;
            this.selected_item = this.container.querySelector('.chosen-single') as HTMLElement;
        }
        this.results_build();
        this.set_tab_index();
        this.set_label_behavior();
    }

    on_ready(): void {
        this.form_field.dispatchEvent(
            new ChosenEvent('chosen:ready', {
                chosen: this,
            }),
        );
    }

    register_observers(): void {
        this.container.addEventListener('touchstart', (evt) => {
            this.container_mousedown(evt);
        });
        this.container.addEventListener('touchend', (evt) => {
            this.container_mouseup(evt);
        });
        this.container.addEventListener('mousedown', (evt) => {
            this.container_mousedown(evt);
        });
        this.container.addEventListener('mouseup', (evt) => {
            this.container_mouseup(evt);
        });
        this.container.addEventListener('mouseenter', (evt) => {
            this.mouse_enter();
        });
        this.container.addEventListener('mouseleave', (evt) => {
            this.mouse_leave();
        });
        this.search_results.addEventListener('mouseup', (evt) => {
            this.search_results_mouseup(evt);
        });
        this.search_results.addEventListener('mouseover', (evt) => {
            this.search_results_mouseover(evt);
        });
        this.search_results.addEventListener('mouseout', (evt) => {
            this.search_results_mouseout(evt);
        });
        this.search_results.addEventListener('wheel', (evt) => {
            this.search_results_mousewheel(evt);
        });
        this.search_results.addEventListener('touchstart', (evt) => {
            this.search_results_touchstart(evt);
        });
        this.search_results.addEventListener('touchmove', (evt) => {
            this.search_results_touchmove(evt);
        });
        this.search_results.addEventListener('touchend', (evt) => {
            this.search_results_touchend(evt);
        });
        this.form_field.addEventListener('chosen:updated', (evt) => {
            this.results_update_field();
        });
        this.form_field.addEventListener('chosen:activate', (evt) => {
            this.activate_field();
        });
        this.form_field.addEventListener('chosen:open', (evt) => {
            this.container_mousedown();
        });
        this.form_field.addEventListener('chosen:close', (evt) => {
            this.close_field();
        });
        this.search_field.addEventListener('blur', (evt) => {
            this.input_blur(evt);
        });
        this.search_field.addEventListener('keyup', (evt) => {
            this.keyup_checker(evt);
        });
        this.search_field.addEventListener('keydown', (evt) => {
            this.keydown_checker(evt);
        });
        this.search_field.addEventListener('focus', (evt) => {
            this.input_focus();
        });
        this.search_field.addEventListener('cut', (evt) => {
            this.clipboard_event_checker(evt);
        });
        this.search_field.addEventListener('paste', (evt) => {
            this.clipboard_event_checker(evt);
        });
        if (this.is_multiple) {
            this.search_choices.addEventListener('click', (evt) => {
                this.choices_click(evt);
            });
        } else {
            this.container.addEventListener('click', (evt) => {
                evt.preventDefault();
            });
        }
    }

    destroy(): void {
        this.container.ownerDocument.removeEventListener('click', this.click_test_action);
        //TODO Chosen event stuff
        // for (const event of ['chosen:updated', 'chosen:activate', 'chosen:open', 'chosen:close']) {
        //     this.form_field.removeEventListener(event);
        // }
        this.container.replaceWith(this.container.cloneNode(true));
        this.search_results.replaceWith(this.search_results.cloneNode(true));
        this.search_field.replaceWith(this.search_field.cloneNode(true));
        if (this.form_field_label != null) {
            this.form_field_label.replaceWith(this.form_field_label.cloneNode(true));
        }
        if (this.is_multiple) {
            this.search_choices.replaceWith(this.search_choices.cloneNode(true));
            this.container.querySelectorAll('.search-choice-close').forEach((choice) => {
                choice.replaceWith(choice.cloneNode(true));
            });
        } else {
            this.selected_item.replaceWith(this.selected_item.cloneNode(true));
        }
        if (this.search_field.tabIndex) {
            this.form_field.tabIndex = this.search_field.tabIndex;
        }
        this.container.remove();
        this.form_field.style.display = '';
    }

    search_field_disabled(): void {
        const ref = getParent(this.form_field, 'fieldset') as HTMLFieldSetElement;
        this.is_disabled =
            this.form_field.disabled || (ref !== undefined ? ref.disabled : undefined) || false;
        if (this.is_disabled) {
            this.container.classList.add('chosen-disabled');
        } else {
            this.container.classList.remove('chosen-disabled');
        }
        this.search_field.disabled = this.is_disabled;
        if (!this.is_multiple) {
            this.selected_item.removeEventListener('focus', this.activate_field);
        }
        if (this.is_disabled) {
            this.close_field();
        } else if (!this.is_multiple) {
            this.selected_item.addEventListener('focus', this.activate_field);
        }
    }

    container_mousedown(evt?: UIEvent): void {
        if (this.is_disabled) {
            return;
        }
        if (
            evt &&
            (evt.type === 'mousedown' || evt.type === 'touchstart') &&
            !this.results_showing
        ) {
            evt.preventDefault();
        }
        if (
            !(
                evt != null &&
                evt.target &&
                (evt.target as HTMLElement).classList.contains('search-choice-close')
            )
        ) {
            if (!this.active_field) {
                if (this.is_multiple) {
                    this.search_field.value = '';
                }
                this.container.ownerDocument.addEventListener('click', this.click_test_action);
                this.results_show();
            } else if (
                !this.is_multiple &&
                evt &&
                (evt.target === this.selected_item ||
                    getParent(evt.target as Element, 'a.chosen-single'))
            ) {
                this.results_toggle();
            }
            this.activate_field();
        }
    }

    container_mouseup(evt: UIEvent): void {
        if ((evt.target as HTMLElement).nodeName === 'ABBR' && !this.is_disabled) {
            this.results_reset();
        }
    }

    search_results_mousewheel(evt: WheelEvent): void {
        let delta = evt.deltaY;
        if (delta != null) {
            evt.preventDefault();
            if (evt.type === 'DOMMouseScroll') {
                delta = delta * 40;
            }
            this.search_results.scrollTop = delta + this.search_results.scrollTop;
        }
    }

    blur_test(): void {
        if (!this.active_field && this.container.classList.contains('chosen-container-active')) {
            this.close_field();
        }
    }

    close_field(): void {
        this.container.ownerDocument.removeEventListener('click', this.click_test_action);
        this.active_field = false;
        this.results_hide();
        this.container.classList.remove('chosen-container-active');
        this.clear_backstroke();
        this.show_search_field_default();
        this.search_field_scale();
        this.search_field.blur();
    }

    activate_field(): void {
        if (this.is_disabled) {
            return;
        }
        this.container.classList.add('chosen-container-active');
        this.active_field = true;
        this.search_field.value = this.get_search_field_value();
        this.search_field.focus();
    }

    test_active_click(evt: MouseEvent): void {
        if (getParent(evt.target as Element, '.chosen-container') === this.container) {
            this.active_field = true;
        } else {
            this.close_field();
        }
    }

    results_build(): void {
        this.parsing = true;
        this.selected_option_count = null;
        this.results_data = SelectParser.select_to_array(this.form_field);
        if (this.is_multiple) {
            const elements = this.search_choices.querySelectorAll('li.search-choice');
            elements.forEach((element) => element.remove());
        } else {
            this.single_set_selected_text();
            if (
                this.disable_search ||
                this.form_field.options.length <= this.disable_search_threshold
            ) {
                this.search_field.readOnly = true;
                this.container.classList.add('chosen-container-single-nosearch');
            } else {
                this.search_field.readOnly = false;
                this.container.classList.remove('chosen-container-single-nosearch');
            }
        }
        this.update_results_content(this.results_option_build(true));
        this.search_field_disabled();
        this.show_search_field_default();
        this.search_field_scale();
        this.parsing = false;
    }

    result_do_highlight(el: HTMLElement): void {
        this.result_clear_highlight();
        this.result_highlight = el;
        this.result_highlight.classList.add('highlighted');
        const maxHeight = parseInt(this.search_results.style.maxHeight, 10);
        const visible_top = this.search_results.scrollTop;
        const visible_bottom = maxHeight + visible_top;
        const high_top = this.result_highlight.offsetTop + this.search_results.scrollTop;
        const high_bottom = high_top + this.result_highlight.offsetHeight;
        if (high_bottom >= visible_bottom) {
            this.search_results.scrollTop =
                high_bottom - maxHeight > 0 ? high_bottom - maxHeight : 0;
        } else if (high_top < visible_top) {
            this.search_results.scrollTop = high_top;
        }
    }

    result_clear_highlight(): void {
        if (this.result_highlight) {
            this.result_highlight.classList.remove('highlighted');
        }
        this.result_highlight = null;
    }

    results_show(): void {
        if (this.is_multiple && this.max_selected_options <= this.choices_count()) {
            this.form_field.dispatchEvent(
                new ChosenEvent('chosen:maxselected', {
                    chosen: this,
                }),
            );
            return;
        }
        this.container.classList.add('chosen-with-drop');
        this.results_showing = true;
        this.search_field.focus();
        this.search_field.value = this.get_search_field_value();
        this.winnow_results();
        this.form_field.dispatchEvent(
            new ChosenEvent('chosen:showing_dropdown', {
                chosen: this,
            }),
        );
    }

    update_results_content(content: string): void {
        this.search_results.innerHTML = content;
    }

    results_hide(): void {
        if (this.results_showing) {
            this.result_clear_highlight();
            this.container.classList.remove('chosen-with-drop');
            this.form_field.dispatchEvent(
                new ChosenEvent('chosen:hiding_dropdown', {
                    chosen: this,
                }),
            );
        }
        this.results_showing = false;
    }

    set_tab_index(): void {
        if (this.form_field.tabIndex) {
            const ti = this.form_field.tabIndex;
            this.form_field.tabIndex = -1;
            this.search_field.tabIndex = ti;
        }
    }

    set_label_behavior(): void {
        this.form_field_label = getParent(this.form_field, 'label') as HTMLLabelElement;
        if (this.form_field_label == null) {
            this.form_field_label = document.querySelector(
                "label[for='" + this.form_field.id + "']",
            ) as HTMLLabelElement;
        }
        if (this.form_field_label != null) {
            this.form_field_label.addEventListener('click', this.label_click_handler);
        }
    }

    show_search_field_default(): void {
        if (this.is_multiple && this.choices_count() < 1 && !this.active_field) {
            this.search_field.value = this.default_text;
            this.search_field.classList.add('default');
        } else {
            this.search_field.value = '';
            this.search_field.classList.remove('default');
        }
    }

    search_results_mouseup(evt: UIEvent): void {
        const target = (evt.target as HTMLElement).classList.contains('active-result')
            ? evt.target
            : getParent(evt.target as Element, '.active-result');
        if (target) {
            this.result_highlight = target as HTMLElement;
            this.result_select(evt);
            this.search_field.focus();
        }
    }

    search_results_mouseover(evt: UIEvent): void {
        const target = (evt.target as HTMLElement).classList.contains('active-result')
            ? evt.target
            : getParent(evt.target as Element, '.active-result');
        if (target) {
            this.result_do_highlight(target as HTMLElement);
        }
    }

    search_results_mouseout(evt: UIEvent): void {
        if (
            (evt.target as HTMLElement).classList.contains('active-result') ||
            getParent(evt.target as Element, '.active-result')
        ) {
            this.result_clear_highlight();
        }
    }

    choice_build(item: SelectParserOptionItem): void {
        const choice = document.createElement('li');
        choice.className = 'search-choice';
        choice.innerHTML = '<span>' + this.choice_label(item) + '</span>';
        if (item.disabled) {
            choice.classList.add('search-choice-disabled');
        } else {
            const close_link = document.createElement('a');
            close_link.href = '#';
            close_link.className = 'search-choice-close';
            close_link.rel = item.array_index.toString();
            close_link.addEventListener('click', (evt: MouseEvent) => {
                this.choice_destroy_link_click(evt);
            });
            choice.appendChild(close_link);
        }
        this.search_container.appendChild(choice);
    }

    choice_destroy_link_click(evt: MouseEvent): void {
        evt.preventDefault();
        evt.stopPropagation();
        if (!this.is_disabled) {
            this.choice_destroy(evt.target as HTMLAnchorElement);
        }
    }

    choice_destroy(link: HTMLAnchorElement): void {
        if (this.result_deselect(parseInt(link.rel, 10))) {
            if (this.active_field) {
                this.search_field.focus();
            } else {
                this.show_search_field_default();
            }
            if (
                this.is_multiple &&
                this.choices_count() > 0 &&
                this.get_search_field_value().length < 1
            ) {
                this.results_hide();
            }
            (getParent(link, 'li') as Element).remove();
            this.search_field_scale();
        }
    }

    results_reset(): void {
        this.reset_single_select_options();
        this.form_field.options[0].selected = true;
        this.single_set_selected_text();
        this.show_search_field_default();
        this.results_reset_cleanup();
        this.trigger_form_field_change();
        if (this.active_field) {
            this.results_hide();
        }
    }

    results_reset_cleanup(): void {
        this.current_selectedIndex = this.form_field.selectedIndex;
        this.selected_item.querySelector('abbr')?.remove();
    }

    result_select(evt: UIEvent): void {
        if (this.result_highlight) {
            const high = this.result_highlight;
            this.result_clear_highlight();
            if (this.is_multiple && this.max_selected_options <= this.choices_count()) {
                this.form_field.dispatchEvent(
                    new ChosenEvent('chosen:maxselected', {
                        chosen: this,
                    }),
                );
                return;
            }
            if (this.is_multiple) {
                high.classList.remove('active-result');
            } else {
                this.reset_single_select_options();
            }
            high.classList.add('result-selected');
            const item: SelectParserOptionItem = this.results_data[
                parseInt(high.getAttribute('data-option-array-index') as string, 10)
            ] as SelectParserOptionItem;
            item.selected = true;
            this.form_field.options[item.options_index as number].selected = true;
            this.selected_option_count = null;
            if (this.is_multiple) {
                this.choice_build(item);
            } else {
                this.single_set_selected_text(this.choice_label(item));
            }
            if (
                this.is_multiple &&
                (!this.hide_results_on_select ||
                    (evt instanceof KeyboardEvent && evt.metaKey) ||
                    (evt instanceof KeyboardEvent && evt.ctrlKey))
            ) {
                if (evt instanceof KeyboardEvent && (evt.metaKey || evt.ctrlKey)) {
                    this.winnow_results(true);
                } else {
                    this.search_field.value = '';
                    this.winnow_results();
                }
            } else {
                this.results_hide();
                this.show_search_field_default();
            }
            if (this.is_multiple || this.form_field.selectedIndex !== this.current_selectedIndex) {
                this.trigger_form_field_change();
            }
            this.current_selectedIndex = this.form_field.selectedIndex;
            evt.preventDefault();
            this.search_field_scale();
        }
    }

    single_set_selected_text(text?: string): void {
        if (text === undefined) {
            text = this.default_text;
        }
        if (text === this.default_text) {
            this.selected_item.classList.add('chosen-default');
        } else {
            this.single_deselect_control_build();
            this.selected_item.classList.remove('chosen-default');
        }
        this.selected_item.querySelector('span')!.innerHTML = text;
    }

    result_deselect(pos: number): boolean {
        const result_data = this.results_data[pos] as SelectParserOptionItem;
        if (!this.form_field.options[result_data.options_index as number].disabled) {
            result_data.selected = false;
            this.form_field.options[result_data.options_index as number].selected = false;
            this.selected_option_count = null;
            this.result_clear_highlight();
            if (this.results_showing) {
                this.winnow_results();
            }
            this.trigger_form_field_change();
            this.search_field_scale();
            return true;
        } else {
            return false;
        }
    }

    single_deselect_control_build(): void {
        if (!this.allow_single_deselect) {
            return;
        }
        if (!this.selected_item.querySelector('abbr')) {
            const abbr = document.createElement('abbr');
            abbr.className = 'search-choice-close';
            this.selected_item
                .querySelector('span')
                ?.parentNode?.insertBefore(abbr, this.selected_item.nextElementSibling);
        }
        this.selected_item.classList.add('chosen-single-with-deselect');
    }

    get_search_field_value(): string {
        return this.search_field.value;
    }

    get_search_text(): string {
        return this.get_search_field_value().trim();
    }

    winnow_results_set_highlight(): void {
        let do_high;
        if (!this.is_multiple) {
            do_high = this.search_results.querySelector('.result-selected.active-result');
        }
        if (do_high == null) {
            do_high = this.search_results.querySelector('.active-result');
        }
        if (do_high != null) {
            this.result_do_highlight(do_high as HTMLElement);
        }
    }

    no_results(terms: string): void {
        this.search_results.appendChild(
            document.createRange().createContextualFragment(this.get_no_results_html(terms)),
        );
        this.form_field.dispatchEvent(
            new ChosenEvent('chosen:no_results', {
                chosen: this,
            }),
        );
    }

    no_results_clear(): void {
        const results = this.search_results.querySelectorAll('.no-results');
        results.forEach((result) => result.remove());
    }

    keydown_arrow(): void {
        if (this.results_showing && this.result_highlight) {
            const next_sib = nextAll(this.result_highlight, 'li.active-result')[0];
            if (next_sib) {
                this.result_do_highlight(next_sib as HTMLElement);
            }
        } else {
            this.results_show();
        }
    }

    keyup_arrow(): void {
        if (!this.results_showing && !this.is_multiple) {
            this.results_show();
        } else if (this.result_highlight) {
            const prev_sibs = prevAll(this.result_highlight, 'li.active-result');
            if (prev_sibs.length) {
                this.result_do_highlight(prev_sibs[0] as HTMLElement);
            } else {
                if (this.choices_count() > 0) {
                    this.results_hide();
                }
                this.result_clear_highlight();
            }
        }
    }

    keydown_backstroke(): void {
        if (this.pending_backstroke) {
            this.choice_destroy(this.pending_backstroke.querySelector('a') as HTMLAnchorElement);
            this.clear_backstroke();
        } else {
            const next_available_destroy = this.search_container.parentNode?.children[-1];
            if (
                next_available_destroy &&
                next_available_destroy.classList.contains('search-choice') &&
                !next_available_destroy.classList.contains('search-choice-disabled')
            ) {
                this.pending_backstroke = next_available_destroy;
                if (this.pending_backstroke) {
                    this.pending_backstroke.classList.add('search-choice-focus');
                }
                if (this.single_backstroke_delete) {
                    this.keydown_backstroke();
                } else {
                    this.pending_backstroke.classList.add('search-choice-focus');
                }
            }
        }
    }

    clear_backstroke(): void {
        if (this.pending_backstroke) {
            this.pending_backstroke.classList.remove('search-choice-focus');
        }
        this.pending_backstroke = null;
    }

    search_field_scale(): void {
        if (!this.is_multiple) {
            return;
        }
        const div = document.createElement('div');
        div.innerText = this.get_search_field_value();
        div.style.position = 'absolute';
        div.style.left = '-1000px';
        div.style.top = '-1000px';
        div.style.display = 'none';
        div.style.whiteSpace = 'pre';

        document.body.appendChild(div);
        let width = div.offsetWidth + 25;
        div.remove();
        const container_width = this.container.offsetWidth;
        if (container_width) {
            width = Math.min(container_width - 10, width);
        }
        this.search_field.style.width = width + 'px';
    }

    trigger_form_field_change(): void {
        this.form_field.dispatchEvent(new Event('input'));
        this.form_field.dispatchEvent(new Event('change'));
    }
}
