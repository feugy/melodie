function noop() { }
const identity = x => x;
function assign(tar, src) {
    // @ts-ignore
    for (const k in src)
        tar[k] = src[k];
    return tar;
}
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
function is_empty(obj) {
    return Object.keys(obj).length === 0;
}
function subscribe(store, ...callbacks) {
    if (store == null) {
        return noop;
    }
    const unsub = store.subscribe(...callbacks);
    return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function get_store_value(store) {
    let value;
    subscribe(store, _ => value = _)();
    return value;
}
function component_subscribe(component, store, callback) {
    component.$$.on_destroy.push(subscribe(store, callback));
}
function create_slot(definition, ctx, $$scope, fn) {
    if (definition) {
        const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
        return definition[0](slot_ctx);
    }
}
function get_slot_context(definition, ctx, $$scope, fn) {
    return definition[1] && fn
        ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
        : $$scope.ctx;
}
function get_slot_changes(definition, $$scope, dirty, fn) {
    if (definition[2] && fn) {
        const lets = definition[2](fn(dirty));
        if ($$scope.dirty === undefined) {
            return lets;
        }
        if (typeof lets === 'object') {
            const merged = [];
            const len = Math.max($$scope.dirty.length, lets.length);
            for (let i = 0; i < len; i += 1) {
                merged[i] = $$scope.dirty[i] | lets[i];
            }
            return merged;
        }
        return $$scope.dirty | lets;
    }
    return $$scope.dirty;
}
function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
    const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
    if (slot_changes) {
        const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
        slot.p(slot_context, slot_changes);
    }
}
function exclude_internal_props(props) {
    const result = {};
    for (const k in props)
        if (k[0] !== '$')
            result[k] = props[k];
    return result;
}
function compute_rest_props(props, keys) {
    const rest = {};
    keys = new Set(keys);
    for (const k in props)
        if (!keys.has(k) && k[0] !== '$')
            rest[k] = props[k];
    return rest;
}
function null_to_empty(value) {
    return value == null ? '' : value;
}
function action_destroyer(action_result) {
    return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
}

const is_client = typeof window !== 'undefined';
let now = is_client
    ? () => window.performance.now()
    : () => Date.now();
let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

const tasks = new Set();
function run_tasks(now) {
    tasks.forEach(task => {
        if (!task.c(now)) {
            tasks.delete(task);
            task.f();
        }
    });
    if (tasks.size !== 0)
        raf(run_tasks);
}
/**
 * Creates a new task that runs on each raf frame
 * until it returns a falsy value or is aborted
 */
function loop(callback) {
    let task;
    if (tasks.size === 0)
        raf(run_tasks);
    return {
        promise: new Promise(fulfill => {
            tasks.add(task = { c: callback, f: fulfill });
        }),
        abort() {
            tasks.delete(task);
        }
    };
}

function append(target, node) {
    target.appendChild(node);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function destroy_each(iterations, detaching) {
    for (let i = 0; i < iterations.length; i += 1) {
        if (iterations[i])
            iterations[i].d(detaching);
    }
}
function element(name) {
    return document.createElement(name);
}
function svg_element(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function empty() {
    return text('');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function prevent_default(fn) {
    return function (event) {
        event.preventDefault();
        // @ts-ignore
        return fn.call(this, event);
    };
}
function stop_propagation(fn) {
    return function (event) {
        event.stopPropagation();
        // @ts-ignore
        return fn.call(this, event);
    };
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
function set_attributes(node, attributes) {
    // @ts-ignore
    const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
    for (const key in attributes) {
        if (attributes[key] == null) {
            node.removeAttribute(key);
        }
        else if (key === 'style') {
            node.style.cssText = attributes[key];
        }
        else if (key === '__value') {
            node.value = node[key] = attributes[key];
        }
        else if (descriptors[key] && descriptors[key].set) {
            node[key] = attributes[key];
        }
        else {
            attr(node, key, attributes[key]);
        }
    }
}
function children(element) {
    return Array.from(element.childNodes);
}
function claim_element(nodes, name, attributes, svg) {
    for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        if (node.nodeName === name) {
            let j = 0;
            const remove = [];
            while (j < node.attributes.length) {
                const attribute = node.attributes[j++];
                if (!attributes[attribute.name]) {
                    remove.push(attribute.name);
                }
            }
            for (let k = 0; k < remove.length; k++) {
                node.removeAttribute(remove[k]);
            }
            return nodes.splice(i, 1)[0];
        }
    }
    return svg ? svg_element(name) : element(name);
}
function claim_text(nodes, data) {
    for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        if (node.nodeType === 3) {
            node.data = '' + data;
            return nodes.splice(i, 1)[0];
        }
    }
    return text(data);
}
function claim_space(nodes) {
    return claim_text(nodes, ' ');
}
function set_data(text, data) {
    data = '' + data;
    if (text.wholeText !== data)
        text.data = data;
}
function set_style(node, key, value, important) {
    node.style.setProperty(key, value, important ? 'important' : '');
}
function toggle_class(element, name, toggle) {
    element.classList[toggle ? 'add' : 'remove'](name);
}
function custom_event(type, detail) {
    const e = document.createEvent('CustomEvent');
    e.initCustomEvent(type, false, false, detail);
    return e;
}
function query_selector_all(selector, parent = document.body) {
    return Array.from(parent.querySelectorAll(selector));
}
class HtmlTag {
    constructor(anchor = null) {
        this.a = anchor;
        this.e = this.n = null;
    }
    m(html, target, anchor = null) {
        if (!this.e) {
            this.e = element(target.nodeName);
            this.t = target;
            this.h(html);
        }
        this.i(anchor);
    }
    h(html) {
        this.e.innerHTML = html;
        this.n = Array.from(this.e.childNodes);
    }
    i(anchor) {
        for (let i = 0; i < this.n.length; i += 1) {
            insert(this.t, this.n[i], anchor);
        }
    }
    p(html) {
        this.d();
        this.h(html);
        this.i(this.a);
    }
    d() {
        this.n.forEach(detach);
    }
}

const active_docs = new Set();
let active = 0;
// https://github.com/darkskyapp/string-hash/blob/master/index.js
function hash(str) {
    let hash = 5381;
    let i = str.length;
    while (i--)
        hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
    return hash >>> 0;
}
function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
    const step = 16.666 / duration;
    let keyframes = '{\n';
    for (let p = 0; p <= 1; p += step) {
        const t = a + (b - a) * ease(p);
        keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
    }
    const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
    const name = `__svelte_${hash(rule)}_${uid}`;
    const doc = node.ownerDocument;
    active_docs.add(doc);
    const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
    const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
    if (!current_rules[name]) {
        current_rules[name] = true;
        stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
    }
    const animation = node.style.animation || '';
    node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
    active += 1;
    return name;
}
function delete_rule(node, name) {
    const previous = (node.style.animation || '').split(', ');
    const next = previous.filter(name
        ? anim => anim.indexOf(name) < 0 // remove specific animation
        : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
    );
    const deleted = previous.length - next.length;
    if (deleted) {
        node.style.animation = next.join(', ');
        active -= deleted;
        if (!active)
            clear_rules();
    }
}
function clear_rules() {
    raf(() => {
        if (active)
            return;
        active_docs.forEach(doc => {
            const stylesheet = doc.__svelte_stylesheet;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            doc.__svelte_rules = {};
        });
        active_docs.clear();
    });
}

let current_component;
function set_current_component(component) {
    current_component = component;
}
function get_current_component() {
    if (!current_component)
        throw new Error(`Function called outside component initialization`);
    return current_component;
}
function onMount(fn) {
    get_current_component().$$.on_mount.push(fn);
}
function afterUpdate(fn) {
    get_current_component().$$.after_update.push(fn);
}
function createEventDispatcher() {
    const component = get_current_component();
    return (type, detail) => {
        const callbacks = component.$$.callbacks[type];
        if (callbacks) {
            // TODO are there situations where events could be dispatched
            // in a server (non-DOM) environment?
            const event = custom_event(type, detail);
            callbacks.slice().forEach(fn => {
                fn.call(component, event);
            });
        }
    };
}
function setContext(key, context) {
    get_current_component().$$.context.set(key, context);
}
// TODO figure out if we still want to support
// shorthand events, or if we want to implement
// a real bubbling mechanism
function bubble(component, event) {
    const callbacks = component.$$.callbacks[event.type];
    if (callbacks) {
        callbacks.slice().forEach(fn => fn(event));
    }
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
let flushing = false;
const seen_callbacks = new Set();
function flush() {
    if (flushing)
        return;
    flushing = true;
    do {
        // first, call beforeUpdate functions
        // and update components
        for (let i = 0; i < dirty_components.length; i += 1) {
            const component = dirty_components[i];
            set_current_component(component);
            update(component.$$);
        }
        set_current_component(null);
        dirty_components.length = 0;
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
                callback();
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
    flushing = false;
    seen_callbacks.clear();
}
function update($$) {
    if ($$.fragment !== null) {
        $$.update();
        run_all($$.before_update);
        const dirty = $$.dirty;
        $$.dirty = [-1];
        $$.fragment && $$.fragment.p($$.ctx, dirty);
        $$.after_update.forEach(add_render_callback);
    }
}

let promise;
function wait() {
    if (!promise) {
        promise = Promise.resolve();
        promise.then(() => {
            promise = null;
        });
    }
    return promise;
}
function dispatch(node, direction, kind) {
    node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
}
const outroing = new Set();
let outros;
function group_outros() {
    outros = {
        r: 0,
        c: [],
        p: outros // parent group
    };
}
function check_outros() {
    if (!outros.r) {
        run_all(outros.c);
    }
    outros = outros.p;
}
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function transition_out(block, local, detach, callback) {
    if (block && block.o) {
        if (outroing.has(block))
            return;
        outroing.add(block);
        outros.c.push(() => {
            outroing.delete(block);
            if (callback) {
                if (detach)
                    block.d(1);
                callback();
            }
        });
        block.o(local);
    }
}
const null_transition = { duration: 0 };
function create_bidirectional_transition(node, fn, params, intro) {
    let config = fn(node, params);
    let t = intro ? 0 : 1;
    let running_program = null;
    let pending_program = null;
    let animation_name = null;
    function clear_animation() {
        if (animation_name)
            delete_rule(node, animation_name);
    }
    function init(program, duration) {
        const d = program.b - t;
        duration *= Math.abs(d);
        return {
            a: t,
            b: program.b,
            d,
            duration,
            start: program.start,
            end: program.start + duration,
            group: program.group
        };
    }
    function go(b) {
        const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
        const program = {
            start: now() + delay,
            b
        };
        if (!b) {
            // @ts-ignore todo: improve typings
            program.group = outros;
            outros.r += 1;
        }
        if (running_program || pending_program) {
            pending_program = program;
        }
        else {
            // if this is an intro, and there's a delay, we need to do
            // an initial tick and/or apply CSS animation immediately
            if (css) {
                clear_animation();
                animation_name = create_rule(node, t, b, duration, delay, easing, css);
            }
            if (b)
                tick(0, 1);
            running_program = init(program, duration);
            add_render_callback(() => dispatch(node, b, 'start'));
            loop(now => {
                if (pending_program && now > pending_program.start) {
                    running_program = init(pending_program, duration);
                    pending_program = null;
                    dispatch(node, running_program.b, 'start');
                    if (css) {
                        clear_animation();
                        animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                    }
                }
                if (running_program) {
                    if (now >= running_program.end) {
                        tick(t = running_program.b, 1 - t);
                        dispatch(node, running_program.b, 'end');
                        if (!pending_program) {
                            // we're done
                            if (running_program.b) {
                                // intro — we can tidy up immediately
                                clear_animation();
                            }
                            else {
                                // outro — needs to be coordinated
                                if (!--running_program.group.r)
                                    run_all(running_program.group.c);
                            }
                        }
                        running_program = null;
                    }
                    else if (now >= running_program.start) {
                        const p = now - running_program.start;
                        t = running_program.a + running_program.d * easing(p / running_program.duration);
                        tick(t, 1 - t);
                    }
                }
                return !!(running_program || pending_program);
            });
        }
    }
    return {
        run(b) {
            if (is_function(config)) {
                wait().then(() => {
                    // @ts-ignore
                    config = config();
                    go(b);
                });
            }
            else {
                go(b);
            }
        },
        end() {
            clear_animation();
            running_program = pending_program = null;
        }
    };
}

const globals = (typeof window !== 'undefined'
    ? window
    : typeof globalThis !== 'undefined'
        ? globalThis
        : global);

function get_spread_update(levels, updates) {
    const update = {};
    const to_null_out = {};
    const accounted_for = { $$scope: 1 };
    let i = levels.length;
    while (i--) {
        const o = levels[i];
        const n = updates[i];
        if (n) {
            for (const key in o) {
                if (!(key in n))
                    to_null_out[key] = 1;
            }
            for (const key in n) {
                if (!accounted_for[key]) {
                    update[key] = n[key];
                    accounted_for[key] = 1;
                }
            }
            levels[i] = n;
        }
        else {
            for (const key in o) {
                accounted_for[key] = 1;
            }
        }
    }
    for (const key in to_null_out) {
        if (!(key in update))
            update[key] = undefined;
    }
    return update;
}
function get_spread_object(spread_props) {
    return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
}
function create_component(block) {
    block && block.c();
}
function claim_component(block, parent_nodes) {
    block && block.l(parent_nodes);
}
function mount_component(component, target, anchor) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    // onMount happens before the initial afterUpdate
    add_render_callback(() => {
        const new_on_destroy = on_mount.map(run).filter(is_function);
        if (on_destroy) {
            on_destroy.push(...new_on_destroy);
        }
        else {
            // Edge case - component was destroyed immediately,
            // most likely as a result of a binding initialising
            run_all(new_on_destroy);
        }
        component.$$.on_mount = [];
    });
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    const $$ = component.$$;
    if ($$.fragment !== null) {
        run_all($$.on_destroy);
        $$.fragment && $$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        $$.on_destroy = $$.fragment = null;
        $$.ctx = [];
    }
}
function make_dirty(component, i) {
    if (component.$$.dirty[0] === -1) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty.fill(0);
    }
    component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
}
function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
    const parent_component = current_component;
    set_current_component(component);
    const prop_values = options.props || {};
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        before_update: [],
        after_update: [],
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty,
        skip_bound: false
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, prop_values, (i, ret, ...rest) => {
            const value = rest.length ? rest[0] : ret;
            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                if (!$$.skip_bound && $$.bound[i])
                    $$.bound[i](value);
                if (ready)
                    make_dirty(component, i);
            }
            return ret;
        })
        : [];
    $$.update();
    ready = true;
    run_all($$.before_update);
    // `false` as a special case of no DOM component
    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
    if (options.target) {
        if (options.hydrate) {
            const nodes = children(options.target);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.l(nodes);
            nodes.forEach(detach);
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor);
        flush();
    }
    set_current_component(parent_component);
}
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set($$props) {
        if (this.$$set && !is_empty($$props)) {
            this.$$.skip_bound = true;
            this.$$set($$props);
            this.$$.skip_bound = false;
        }
    }
}

const subscriber_queue = [];
/**
 * Creates a `Readable` store that allows reading by subscription.
 * @param value initial value
 * @param {StartStopNotifier}start start and stop notifications for subscriptions
 */
function readable(value, start) {
    return {
        subscribe: writable(value, start).subscribe
    };
}
/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 * @param {*=}value initial value
 * @param {StartStopNotifier=}start start and stop notifications for subscriptions
 */
function writable(value, start = noop) {
    let stop;
    const subscribers = [];
    function set(new_value) {
        if (safe_not_equal(value, new_value)) {
            value = new_value;
            if (stop) { // store is ready
                const run_queue = !subscriber_queue.length;
                for (let i = 0; i < subscribers.length; i += 1) {
                    const s = subscribers[i];
                    s[1]();
                    subscriber_queue.push(s, value);
                }
                if (run_queue) {
                    for (let i = 0; i < subscriber_queue.length; i += 2) {
                        subscriber_queue[i][0](subscriber_queue[i + 1]);
                    }
                    subscriber_queue.length = 0;
                }
            }
        }
    }
    function update(fn) {
        set(fn(value));
    }
    function subscribe(run, invalidate = noop) {
        const subscriber = [run, invalidate];
        subscribers.push(subscriber);
        if (subscribers.length === 1) {
            stop = start(set) || noop;
        }
        run(value);
        return () => {
            const index = subscribers.indexOf(subscriber);
            if (index !== -1) {
                subscribers.splice(index, 1);
            }
            if (subscribers.length === 0) {
                stop();
                stop = null;
            }
        };
    }
    return { set, update, subscribe };
}
function derived(stores, fn, initial_value) {
    const single = !Array.isArray(stores);
    const stores_array = single
        ? [stores]
        : stores;
    const auto = fn.length < 2;
    return readable(initial_value, (set) => {
        let inited = false;
        const values = [];
        let pending = 0;
        let cleanup = noop;
        const sync = () => {
            if (pending) {
                return;
            }
            cleanup();
            const result = fn(single ? values[0] : values, set);
            if (auto) {
                set(result);
            }
            else {
                cleanup = is_function(result) ? result : noop;
            }
        };
        const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
            values[i] = value;
            pending &= ~(1 << i);
            if (inited) {
                sync();
            }
        }, () => {
            pending |= (1 << i);
        }));
        inited = true;
        sync();
        return function stop() {
            run_all(unsubscribers);
            cleanup();
        };
    });
}

function createCommonjsModule(fn, basedir, module) {
	return module = {
		path: basedir,
		exports: {},
		require: function (path, base) {
			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
		}
	}, fn(module, module.exports), module.exports;
}

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
}

var formatMessageParse = createCommonjsModule(function (module, exports) {

/*::
export type AST = Element[]
export type Element = string | Placeholder
export type Placeholder = Plural | Styled | Typed | Simple
export type Plural = [ string, 'plural' | 'selectordinal', number, SubMessages ]
export type Styled = [ string, string, string | SubMessages ]
export type Typed = [ string, string ]
export type Simple = [ string ]
export type SubMessages = { [string]: AST }
export type Token = [ TokenType, string ]
export type TokenType = 'text' | 'space' | 'id' | 'type' | 'style' | 'offset' | 'number' | 'selector' | 'syntax'
type Context = {|
  pattern: string,
  index: number,
  tagsType: ?string,
  tokens: ?Token[]
|}
*/

var ARG_OPN = '{';
var ARG_CLS = '}';
var ARG_SEP = ',';
var NUM_ARG = '#';
var TAG_OPN = '<';
var TAG_CLS = '>';
var TAG_END = '</';
var TAG_SELF_CLS = '/>';
var ESC = '\'';
var OFFSET = 'offset:';
var simpleTypes = [
  'number',
  'date',
  'time',
  'ordinal',
  'duration',
  'spellout'
];
var submTypes = [
  'plural',
  'select',
  'selectordinal'
];

/**
 * parse
 *
 * Turns this:
 *  `You have { numBananas, plural,
 *       =0 {no bananas}
 *      one {a banana}
 *    other {# bananas}
 *  } for sale`
 *
 * into this:
 *  [ "You have ", [ "numBananas", "plural", 0, {
 *       "=0": [ "no bananas" ],
 *      "one": [ "a banana" ],
 *    "other": [ [ '#' ], " bananas" ]
 *  } ], " for sale." ]
 *
 * tokens:
 *  [
 *    [ "text", "You have " ],
 *    [ "syntax", "{" ],
 *    [ "space", " " ],
 *    [ "id", "numBananas" ],
 *    [ "syntax", ", " ],
 *    [ "space", " " ],
 *    [ "type", "plural" ],
 *    [ "syntax", "," ],
 *    [ "space", "\n     " ],
 *    [ "selector", "=0" ],
 *    [ "space", " " ],
 *    [ "syntax", "{" ],
 *    [ "text", "no bananas" ],
 *    [ "syntax", "}" ],
 *    [ "space", "\n    " ],
 *    [ "selector", "one" ],
 *    [ "space", " " ],
 *    [ "syntax", "{" ],
 *    [ "text", "a banana" ],
 *    [ "syntax", "}" ],
 *    [ "space", "\n  " ],
 *    [ "selector", "other" ],
 *    [ "space", " " ],
 *    [ "syntax", "{" ],
 *    [ "syntax", "#" ],
 *    [ "text", " bananas" ],
 *    [ "syntax", "}" ],
 *    [ "space", "\n" ],
 *    [ "syntax", "}" ],
 *    [ "text", " for sale." ]
 *  ]
 **/
exports = module.exports = function parse (
  pattern/*: string */,
  options/*:: ?: { tagsType?: string, tokens?: Token[] } */
)/*: AST */ {
  return parseAST({
    pattern: String(pattern),
    index: 0,
    tagsType: (options && options.tagsType) || null,
    tokens: (options && options.tokens) || null
  }, '')
};

function parseAST (current/*: Context */, parentType/*: string */)/*: AST */ {
  var pattern = current.pattern;
  var length = pattern.length;
  var elements/*: AST */ = [];
  var start = current.index;
  var text = parseText(current, parentType);
  if (text) elements.push(text);
  if (text && current.tokens) current.tokens.push([ 'text', pattern.slice(start, current.index) ]);
  while (current.index < length) {
    if (pattern[current.index] === ARG_CLS) {
      if (!parentType) throw expected(current)
      break
    }
    if (parentType && current.tagsType && pattern.slice(current.index, current.index + TAG_END.length) === TAG_END) break
    elements.push(parsePlaceholder(current));
    start = current.index;
    text = parseText(current, parentType);
    if (text) elements.push(text);
    if (text && current.tokens) current.tokens.push([ 'text', pattern.slice(start, current.index) ]);
  }
  return elements
}

function parseText (current/*: Context */, parentType/*: string */)/*: string */ {
  var pattern = current.pattern;
  var length = pattern.length;
  var isHashSpecial = (parentType === 'plural' || parentType === 'selectordinal');
  var isAngleSpecial = !!current.tagsType;
  var isArgStyle = (parentType === '{style}');
  var text = '';
  while (current.index < length) {
    var char = pattern[current.index];
    if (
      char === ARG_OPN || char === ARG_CLS ||
      (isHashSpecial && char === NUM_ARG) ||
      (isAngleSpecial && char === TAG_OPN) ||
      (isArgStyle && isWhitespace(char.charCodeAt(0)))
    ) {
      break
    } else if (char === ESC) {
      char = pattern[++current.index];
      if (char === ESC) { // double is always 1 '
        text += char;
        ++current.index;
      } else if (
        // only when necessary
        char === ARG_OPN || char === ARG_CLS ||
        (isHashSpecial && char === NUM_ARG) ||
        (isAngleSpecial && char === TAG_OPN) ||
        isArgStyle
      ) {
        text += char;
        while (++current.index < length) {
          char = pattern[current.index];
          if (char === ESC && pattern[current.index + 1] === ESC) { // double is always 1 '
            text += ESC;
            ++current.index;
          } else if (char === ESC) { // end of quoted
            ++current.index;
            break
          } else {
            text += char;
          }
        }
      } else { // lone ' is just a '
        text += ESC;
        // already incremented
      }
    } else {
      text += char;
      ++current.index;
    }
  }
  return text
}

function isWhitespace (code/*: number */)/*: boolean */ {
  return (
    (code >= 0x09 && code <= 0x0D) ||
    code === 0x20 || code === 0x85 || code === 0xA0 || code === 0x180E ||
    (code >= 0x2000 && code <= 0x200D) ||
    code === 0x2028 || code === 0x2029 || code === 0x202F || code === 0x205F ||
    code === 0x2060 || code === 0x3000 || code === 0xFEFF
  )
}

function skipWhitespace (current/*: Context */)/*: void */ {
  var pattern = current.pattern;
  var length = pattern.length;
  var start = current.index;
  while (current.index < length && isWhitespace(pattern.charCodeAt(current.index))) {
    ++current.index;
  }
  if (start < current.index && current.tokens) {
    current.tokens.push([ 'space', current.pattern.slice(start, current.index) ]);
  }
}

function parsePlaceholder (current/*: Context */)/*: Placeholder */ {
  var pattern = current.pattern;
  if (pattern[current.index] === NUM_ARG) {
    if (current.tokens) current.tokens.push([ 'syntax', NUM_ARG ]);
    ++current.index; // move passed #
    return [ NUM_ARG ]
  }

  var tag = parseTag(current);
  if (tag) return tag

  /* istanbul ignore if should be unreachable if parseAST and parseText are right */
  if (pattern[current.index] !== ARG_OPN) throw expected(current, ARG_OPN)
  if (current.tokens) current.tokens.push([ 'syntax', ARG_OPN ]);
  ++current.index; // move passed {
  skipWhitespace(current);

  var id = parseId(current);
  if (!id) throw expected(current, 'placeholder id')
  if (current.tokens) current.tokens.push([ 'id', id ]);
  skipWhitespace(current);

  var char = pattern[current.index];
  if (char === ARG_CLS) { // end placeholder
    if (current.tokens) current.tokens.push([ 'syntax', ARG_CLS ]);
    ++current.index; // move passed }
    return [ id ]
  }

  if (char !== ARG_SEP) throw expected(current, ARG_SEP + ' or ' + ARG_CLS)
  if (current.tokens) current.tokens.push([ 'syntax', ARG_SEP ]);
  ++current.index; // move passed ,
  skipWhitespace(current);

  var type = parseId(current);
  if (!type) throw expected(current, 'placeholder type')
  if (current.tokens) current.tokens.push([ 'type', type ]);
  skipWhitespace(current);
  char = pattern[current.index];
  if (char === ARG_CLS) { // end placeholder
    if (current.tokens) current.tokens.push([ 'syntax', ARG_CLS ]);
    if (type === 'plural' || type === 'selectordinal' || type === 'select') {
      throw expected(current, type + ' sub-messages')
    }
    ++current.index; // move passed }
    return [ id, type ]
  }

  if (char !== ARG_SEP) throw expected(current, ARG_SEP + ' or ' + ARG_CLS)
  if (current.tokens) current.tokens.push([ 'syntax', ARG_SEP ]);
  ++current.index; // move passed ,
  skipWhitespace(current);

  var arg;
  if (type === 'plural' || type === 'selectordinal') {
    var offset = parsePluralOffset(current);
    skipWhitespace(current);
    arg = [ id, type, offset, parseSubMessages(current, type) ];
  } else if (type === 'select') {
    arg = [ id, type, parseSubMessages(current, type) ];
  } else if (simpleTypes.indexOf(type) >= 0) {
    arg = [ id, type, parseSimpleFormat(current) ];
  } else { // custom placeholder type
    var index = current.index;
    var format/*: string | SubMessages */ = parseSimpleFormat(current);
    skipWhitespace(current);
    if (pattern[current.index] === ARG_OPN) {
      current.index = index; // rewind, since should have been submessages
      format = parseSubMessages(current, type);
    }
    arg = [ id, type, format ];
  }

  skipWhitespace(current);
  if (pattern[current.index] !== ARG_CLS) throw expected(current, ARG_CLS)
  if (current.tokens) current.tokens.push([ 'syntax', ARG_CLS ]);
  ++current.index; // move passed }
  return arg
}

function parseTag (current/*: Context */)/*: ?Placeholder */ {
  var tagsType = current.tagsType;
  if (!tagsType || current.pattern[current.index] !== TAG_OPN) return

  if (current.pattern.slice(current.index, current.index + TAG_END.length) === TAG_END) {
    throw expected(current, null, 'closing tag without matching opening tag')
  }
  if (current.tokens) current.tokens.push([ 'syntax', TAG_OPN ]);
  ++current.index; // move passed <

  var id = parseId(current, true);
  if (!id) throw expected(current, 'placeholder id')
  if (current.tokens) current.tokens.push([ 'id', id ]);
  skipWhitespace(current);

  if (current.pattern.slice(current.index, current.index + TAG_SELF_CLS.length) === TAG_SELF_CLS) {
    if (current.tokens) current.tokens.push([ 'syntax', TAG_SELF_CLS ]);
    current.index += TAG_SELF_CLS.length;
    return [ id, tagsType ]
  }
  if (current.pattern[current.index] !== TAG_CLS) throw expected(current, TAG_CLS)
  if (current.tokens) current.tokens.push([ 'syntax', TAG_CLS ]);
  ++current.index; // move passed >

  var children = parseAST(current, tagsType);

  var end = current.index;
  if (current.pattern.slice(current.index, current.index + TAG_END.length) !== TAG_END) throw expected(current, TAG_END + id + TAG_CLS)
  if (current.tokens) current.tokens.push([ 'syntax', TAG_END ]);
  current.index += TAG_END.length;
  var closeId = parseId(current, true);
  if (closeId && current.tokens) current.tokens.push([ 'id', closeId ]);
  if (id !== closeId) {
    current.index = end; // rewind for better error message
    throw expected(current, TAG_END + id + TAG_CLS, TAG_END + closeId + TAG_CLS)
  }
  skipWhitespace(current);
  if (current.pattern[current.index] !== TAG_CLS) throw expected(current, TAG_CLS)
  if (current.tokens) current.tokens.push([ 'syntax', TAG_CLS ]);
  ++current.index; // move passed >

  return [ id, tagsType, { children: children } ]
}

function parseId (current/*: Context */, isTag/*:: ?: boolean */)/*: string */ {
  var pattern = current.pattern;
  var length = pattern.length;
  var id = '';
  while (current.index < length) {
    var char = pattern[current.index];
    if (
      char === ARG_OPN || char === ARG_CLS || char === ARG_SEP ||
      char === NUM_ARG || char === ESC || isWhitespace(char.charCodeAt(0)) ||
      (isTag && (char === TAG_OPN || char === TAG_CLS || char === '/'))
    ) break
    id += char;
    ++current.index;
  }
  return id
}

function parseSimpleFormat (current/*: Context */)/*: string */ {
  var start = current.index;
  var style = parseText(current, '{style}');
  if (!style) throw expected(current, 'placeholder style name')
  if (current.tokens) current.tokens.push([ 'style', current.pattern.slice(start, current.index) ]);
  return style
}

function parsePluralOffset (current/*: Context */)/*: number */ {
  var pattern = current.pattern;
  var length = pattern.length;
  var offset = 0;
  if (pattern.slice(current.index, current.index + OFFSET.length) === OFFSET) {
    if (current.tokens) current.tokens.push([ 'offset', 'offset' ], [ 'syntax', ':' ]);
    current.index += OFFSET.length; // move passed offset:
    skipWhitespace(current);
    var start = current.index;
    while (current.index < length && isDigit(pattern.charCodeAt(current.index))) {
      ++current.index;
    }
    if (start === current.index) throw expected(current, 'offset number')
    if (current.tokens) current.tokens.push([ 'number', pattern.slice(start, current.index) ]);
    offset = +pattern.slice(start, current.index);
  }
  return offset
}

function isDigit (code/*: number */)/*: boolean */ {
  return (code >= 0x30 && code <= 0x39)
}

function parseSubMessages (current/*: Context */, parentType/*: string */)/*: SubMessages */ {
  var pattern = current.pattern;
  var length = pattern.length;
  var options/*: SubMessages */ = {};
  while (current.index < length && pattern[current.index] !== ARG_CLS) {
    var selector = parseId(current);
    if (!selector) throw expected(current, 'sub-message selector')
    if (current.tokens) current.tokens.push([ 'selector', selector ]);
    skipWhitespace(current);
    options[selector] = parseSubMessage(current, parentType);
    skipWhitespace(current);
  }
  if (!options.other && submTypes.indexOf(parentType) >= 0) {
    throw expected(current, null, null, '"other" sub-message must be specified in ' + parentType)
  }
  return options
}

function parseSubMessage (current/*: Context */, parentType/*: string */)/*: AST */ {
  if (current.pattern[current.index] !== ARG_OPN) throw expected(current, ARG_OPN + ' to start sub-message')
  if (current.tokens) current.tokens.push([ 'syntax', ARG_OPN ]);
  ++current.index; // move passed {
  var message = parseAST(current, parentType);
  if (current.pattern[current.index] !== ARG_CLS) throw expected(current, ARG_CLS + ' to end sub-message')
  if (current.tokens) current.tokens.push([ 'syntax', ARG_CLS ]);
  ++current.index; // move passed }
  return message
}

function expected (current/*: Context */, expected/*:: ?: ?string */, found/*:: ?: ?string */, message/*:: ?: string */) {
  var pattern = current.pattern;
  var lines = pattern.slice(0, current.index).split(/\r?\n/);
  var offset = current.index;
  var line = lines.length;
  var column = lines.slice(-1)[0].length;
  found = found || (
    (current.index >= pattern.length) ? 'end of message pattern'
      : (parseId(current) || pattern[current.index])
  );
  if (!message) message = errorMessage(expected, found);
  message += ' in ' + pattern.replace(/\r?\n/g, '\n');
  return new SyntaxError(message, expected, found, offset, line, column)
}

function errorMessage (expected/*: ?string */, found/* string */) {
  if (!expected) return 'Unexpected ' + found + ' found'
  return 'Expected ' + expected + ' but found ' + found
}

/**
 * SyntaxError
 *  Holds information about bad syntax found in a message pattern
 **/
function SyntaxError (message/*: string */, expected/*: ?string */, found/*: ?string */, offset/*: number */, line/*: number */, column/*: number */) {
  Error.call(this, message);
  this.name = 'SyntaxError';
  this.message = message;
  this.expected = expected;
  this.found = found;
  this.offset = offset;
  this.line = line;
  this.column = column;
}
SyntaxError.prototype = Object.create(Error.prototype);
exports.SyntaxError = SyntaxError;
});

// @flow
var LONG = 'long';
var SHORT = 'short';
var NARROW = 'narrow';
var NUMERIC = 'numeric';
var TWODIGIT = '2-digit';

/**
 * formatting information
 **/
var formatMessageFormats = {
  number: {
    decimal: {
      style: 'decimal'
    },
    integer: {
      style: 'decimal',
      maximumFractionDigits: 0
    },
    currency: {
      style: 'currency',
      currency: 'USD'
    },
    percent: {
      style: 'percent'
    },
    default: {
      style: 'decimal'
    }
  },
  date: {
    short: {
      month: NUMERIC,
      day: NUMERIC,
      year: TWODIGIT
    },
    medium: {
      month: SHORT,
      day: NUMERIC,
      year: NUMERIC
    },
    long: {
      month: LONG,
      day: NUMERIC,
      year: NUMERIC
    },
    full: {
      month: LONG,
      day: NUMERIC,
      year: NUMERIC,
      weekday: LONG
    },
    default: {
      month: SHORT,
      day: NUMERIC,
      year: NUMERIC
    }
  },
  time: {
    short: {
      hour: NUMERIC,
      minute: NUMERIC
    },
    medium: {
      hour: NUMERIC,
      minute: NUMERIC,
      second: NUMERIC
    },
    long: {
      hour: NUMERIC,
      minute: NUMERIC,
      second: NUMERIC,
      timeZoneName: SHORT
    },
    full: {
      hour: NUMERIC,
      minute: NUMERIC,
      second: NUMERIC,
      timeZoneName: SHORT
    },
    default: {
      hour: NUMERIC,
      minute: NUMERIC,
      second: NUMERIC
    }
  },
  duration: {
    default: {
      hours: {
        minimumIntegerDigits: 1,
        maximumFractionDigits: 0
      },
      minutes: {
        minimumIntegerDigits: 2,
        maximumFractionDigits: 0
      },
      seconds: {
        minimumIntegerDigits: 2,
        maximumFractionDigits: 3
      }
    }
  },
  parseNumberPattern: function (pattern/*: ?string */) {
    if (!pattern) return
    var options = {};
    var currency = pattern.match(/\b[A-Z]{3}\b/i);
    var syms = pattern.replace(/[^¤]/g, '').length;
    if (!syms && currency) syms = 1;
    if (syms) {
      options.style = 'currency';
      options.currencyDisplay = syms === 1 ? 'symbol' : syms === 2 ? 'code' : 'name';
      options.currency = currency ? currency[0].toUpperCase() : 'USD';
    } else if (pattern.indexOf('%') >= 0) {
      options.style = 'percent';
    }
    if (!/[@#0]/.test(pattern)) return options.style ? options : undefined
    options.useGrouping = pattern.indexOf(',') >= 0;
    if (/E\+?[@#0]+/i.test(pattern) || pattern.indexOf('@') >= 0) {
      var size = pattern.replace(/E\+?[@#0]+|[^@#0]/gi, '');
      options.minimumSignificantDigits = Math.min(Math.max(size.replace(/[^@0]/g, '').length, 1), 21);
      options.maximumSignificantDigits = Math.min(Math.max(size.length, 1), 21);
    } else {
      var parts = pattern.replace(/[^#0.]/g, '').split('.');
      var integer = parts[0];
      var n = integer.length - 1;
      while (integer[n] === '0') --n;
      options.minimumIntegerDigits = Math.min(Math.max(integer.length - 1 - n, 1), 21);
      var fraction = parts[1] || '';
      n = 0;
      while (fraction[n] === '0') ++n;
      options.minimumFractionDigits = Math.min(Math.max(n, 0), 20);
      while (fraction[n] === '#') ++n;
      options.maximumFractionDigits = Math.min(Math.max(n, 0), 20);
    }
    return options
  },
  parseDatePattern: function (pattern/*: ?string */) {
    if (!pattern) return
    var options = {};
    for (var i = 0; i < pattern.length;) {
      var current = pattern[i];
      var n = 1;
      while (pattern[++i] === current) ++n;
      switch (current) {
        case 'G':
          options.era = n === 5 ? NARROW : n === 4 ? LONG : SHORT;
          break
        case 'y':
        case 'Y':
          options.year = n === 2 ? TWODIGIT : NUMERIC;
          break
        case 'M':
        case 'L':
          n = Math.min(Math.max(n - 1, 0), 4);
          options.month = [ NUMERIC, TWODIGIT, SHORT, LONG, NARROW ][n];
          break
        case 'E':
        case 'e':
        case 'c':
          options.weekday = n === 5 ? NARROW : n === 4 ? LONG : SHORT;
          break
        case 'd':
        case 'D':
          options.day = n === 2 ? TWODIGIT : NUMERIC;
          break
        case 'h':
        case 'K':
          options.hour12 = true;
          options.hour = n === 2 ? TWODIGIT : NUMERIC;
          break
        case 'H':
        case 'k':
          options.hour12 = false;
          options.hour = n === 2 ? TWODIGIT : NUMERIC;
          break
        case 'm':
          options.minute = n === 2 ? TWODIGIT : NUMERIC;
          break
        case 's':
        case 'S':
          options.second = n === 2 ? TWODIGIT : NUMERIC;
          break
        case 'z':
        case 'Z':
        case 'v':
        case 'V':
          options.timeZoneName = n === 1 ? SHORT : LONG;
          break
      }
    }
    return Object.keys(options).length ? options : undefined
  }
};

// @flow
// "lookup" algorithm http://tools.ietf.org/html/rfc4647#section-3.4
// assumes normalized language tags, and matches in a case sensitive manner
var lookupClosestLocale = function lookupClosestLocale (locale/*: string | string[] | void */, available/*: { [string]: any } */)/*: ?string */ {
  if (typeof locale === 'string' && available[locale]) return locale
  var locales = [].concat(locale || []);
  for (var l = 0, ll = locales.length; l < ll; ++l) {
    var current = locales[l].split('-');
    while (current.length) {
      var candidate = current.join('-');
      if (available[candidate]) return candidate
      current.pop();
    }
  }
};

// @flow

/*:: export type Rule = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other' */
var zero = 'zero', one = 'one', two = 'two', few = 'few', many = 'many', other = 'other';
var f = [
  function (s/*: string | number */)/*: Rule */ {
    var n = +s;
    return n === 1 ? one
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var n = +s;
    return 0 <= n && n <= 1 ? one
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var i = Math.floor(Math.abs(+s));
    var n = +s;
    return i === 0 || n === 1 ? one
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var n = +s;
    return n === 0 ? zero
      : n === 1 ? one
      : n === 2 ? two
      : 3 <= n % 100 && n % 100 <= 10 ? few
      : 11 <= n % 100 && n % 100 <= 99 ? many
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var i = Math.floor(Math.abs(+s));
    var v = (s + '.').split('.')[1].length;
    return i === 1 && v === 0 ? one
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var n = +s;
    return n % 10 === 1 && n % 100 !== 11 ? one
      : (2 <= n % 10 && n % 10 <= 4) && (n % 100 < 12 || 14 < n % 100) ? few
      : n % 10 === 0 || (5 <= n % 10 && n % 10 <= 9) || (11 <= n % 100 && n % 100 <= 14) ? many
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var n = +s;
    return n % 10 === 1 && (n % 100 !== 11 && n % 100 !== 71 && n % 100 !== 91) ? one
      : n % 10 === 2 && (n % 100 !== 12 && n % 100 !== 72 && n % 100 !== 92) ? two
      : ((3 <= n % 10 && n % 10 <= 4) || n % 10 === 9) && ((n % 100 < 10 || 19 < n % 100) && (n % 100 < 70 || 79 < n % 100) && (n % 100 < 90 || 99 < n % 100)) ? few
      : n !== 0 && n % 1000000 === 0 ? many
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var i = Math.floor(Math.abs(+s));
    var v = (s + '.').split('.')[1].length;
    var f = +(s + '.').split('.')[1];
    return v === 0 && i % 10 === 1 && i % 100 !== 11 || f % 10 === 1 && f % 100 !== 11 ? one
      : v === 0 && (2 <= i % 10 && i % 10 <= 4) && (i % 100 < 12 || 14 < i % 100) || (2 <= f % 10 && f % 10 <= 4) && (f % 100 < 12 || 14 < f % 100) ? few
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var i = Math.floor(Math.abs(+s));
    var v = (s + '.').split('.')[1].length;
    return i === 1 && v === 0 ? one
      : (2 <= i && i <= 4) && v === 0 ? few
      : v !== 0 ? many
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var n = +s;
    return n === 0 ? zero
      : n === 1 ? one
      : n === 2 ? two
      : n === 3 ? few
      : n === 6 ? many
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var i = Math.floor(Math.abs(+s));
    var t = +('' + s).replace(/^[^.]*.?|0+$/g, '');
    var n = +s;
    return n === 1 || t !== 0 && (i === 0 || i === 1) ? one
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var i = Math.floor(Math.abs(+s));
    var v = (s + '.').split('.')[1].length;
    var f = +(s + '.').split('.')[1];
    return v === 0 && i % 100 === 1 || f % 100 === 1 ? one
      : v === 0 && i % 100 === 2 || f % 100 === 2 ? two
      : v === 0 && (3 <= i % 100 && i % 100 <= 4) || (3 <= f % 100 && f % 100 <= 4) ? few
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var i = Math.floor(Math.abs(+s));
    return i === 0 || i === 1 ? one
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var i = Math.floor(Math.abs(+s));
    var v = (s + '.').split('.')[1].length;
    var f = +(s + '.').split('.')[1];
    return v === 0 && (i === 1 || i === 2 || i === 3) || v === 0 && (i % 10 !== 4 && i % 10 !== 6 && i % 10 !== 9) || v !== 0 && (f % 10 !== 4 && f % 10 !== 6 && f % 10 !== 9) ? one
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var n = +s;
    return n === 1 ? one
      : n === 2 ? two
      : 3 <= n && n <= 6 ? few
      : 7 <= n && n <= 10 ? many
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var n = +s;
    return n === 1 || n === 11 ? one
      : n === 2 || n === 12 ? two
      : ((3 <= n && n <= 10) || (13 <= n && n <= 19)) ? few
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var i = Math.floor(Math.abs(+s));
    var v = (s + '.').split('.')[1].length;
    return v === 0 && i % 10 === 1 ? one
      : v === 0 && i % 10 === 2 ? two
      : v === 0 && (i % 100 === 0 || i % 100 === 20 || i % 100 === 40 || i % 100 === 60 || i % 100 === 80) ? few
      : v !== 0 ? many
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var i = Math.floor(Math.abs(+s));
    var v = (s + '.').split('.')[1].length;
    var n = +s;
    return i === 1 && v === 0 ? one
      : i === 2 && v === 0 ? two
      : v === 0 && (n < 0 || 10 < n) && n % 10 === 0 ? many
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var i = Math.floor(Math.abs(+s));
    var t = +('' + s).replace(/^[^.]*.?|0+$/g, '');
    return t === 0 && i % 10 === 1 && i % 100 !== 11 || t !== 0 ? one
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var n = +s;
    return n === 1 ? one
      : n === 2 ? two
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var n = +s;
    return n === 0 ? zero
      : n === 1 ? one
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var i = Math.floor(Math.abs(+s));
    var n = +s;
    return n === 0 ? zero
      : (i === 0 || i === 1) && n !== 0 ? one
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var f = +(s + '.').split('.')[1];
    var n = +s;
    return n % 10 === 1 && (n % 100 < 11 || 19 < n % 100) ? one
      : (2 <= n % 10 && n % 10 <= 9) && (n % 100 < 11 || 19 < n % 100) ? few
      : f !== 0 ? many
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var v = (s + '.').split('.')[1].length;
    var f = +(s + '.').split('.')[1];
    var n = +s;
    return n % 10 === 0 || (11 <= n % 100 && n % 100 <= 19) || v === 2 && (11 <= f % 100 && f % 100 <= 19) ? zero
      : n % 10 === 1 && n % 100 !== 11 || v === 2 && f % 10 === 1 && f % 100 !== 11 || v !== 2 && f % 10 === 1 ? one
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var i = Math.floor(Math.abs(+s));
    var v = (s + '.').split('.')[1].length;
    var f = +(s + '.').split('.')[1];
    return v === 0 && i % 10 === 1 && i % 100 !== 11 || f % 10 === 1 && f % 100 !== 11 ? one
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var i = Math.floor(Math.abs(+s));
    var v = (s + '.').split('.')[1].length;
    var n = +s;
    return i === 1 && v === 0 ? one
      : v !== 0 || n === 0 || n !== 1 && (1 <= n % 100 && n % 100 <= 19) ? few
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var n = +s;
    return n === 1 ? one
      : n === 0 || (2 <= n % 100 && n % 100 <= 10) ? few
      : 11 <= n % 100 && n % 100 <= 19 ? many
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var i = Math.floor(Math.abs(+s));
    var v = (s + '.').split('.')[1].length;
    return i === 1 && v === 0 ? one
      : v === 0 && (2 <= i % 10 && i % 10 <= 4) && (i % 100 < 12 || 14 < i % 100) ? few
      : v === 0 && i !== 1 && (0 <= i % 10 && i % 10 <= 1) || v === 0 && (5 <= i % 10 && i % 10 <= 9) || v === 0 && (12 <= i % 100 && i % 100 <= 14) ? many
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var i = Math.floor(Math.abs(+s));
    return 0 <= i && i <= 1 ? one
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var i = Math.floor(Math.abs(+s));
    var v = (s + '.').split('.')[1].length;
    return v === 0 && i % 10 === 1 && i % 100 !== 11 ? one
      : v === 0 && (2 <= i % 10 && i % 10 <= 4) && (i % 100 < 12 || 14 < i % 100) ? few
      : v === 0 && i % 10 === 0 || v === 0 && (5 <= i % 10 && i % 10 <= 9) || v === 0 && (11 <= i % 100 && i % 100 <= 14) ? many
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var i = Math.floor(Math.abs(+s));
    var n = +s;
    return i === 0 || n === 1 ? one
      : 2 <= n && n <= 10 ? few
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var i = Math.floor(Math.abs(+s));
    var f = +(s + '.').split('.')[1];
    var n = +s;
    return (n === 0 || n === 1) || i === 0 && f === 1 ? one
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var i = Math.floor(Math.abs(+s));
    var v = (s + '.').split('.')[1].length;
    return v === 0 && i % 100 === 1 ? one
      : v === 0 && i % 100 === 2 ? two
      : v === 0 && (3 <= i % 100 && i % 100 <= 4) || v !== 0 ? few
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var n = +s;
    return (0 <= n && n <= 1) || (11 <= n && n <= 99) ? one
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var n = +s;
    return n === 1 || n === 5 || n === 7 || n === 8 || n === 9 || n === 10 ? one
      : n === 2 || n === 3 ? two
      : n === 4 ? few
      : n === 6 ? many
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var i = Math.floor(Math.abs(+s));
    return (i % 10 === 1 || i % 10 === 2 || i % 10 === 5 || i % 10 === 7 || i % 10 === 8) || (i % 100 === 20 || i % 100 === 50 || i % 100 === 70 || i % 100 === 80) ? one
      : (i % 10 === 3 || i % 10 === 4) || (i % 1000 === 100 || i % 1000 === 200 || i % 1000 === 300 || i % 1000 === 400 || i % 1000 === 500 || i % 1000 === 600 || i % 1000 === 700 || i % 1000 === 800 || i % 1000 === 900) ? few
      : i === 0 || i % 10 === 6 || (i % 100 === 40 || i % 100 === 60 || i % 100 === 90) ? many
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var n = +s;
    return (n % 10 === 2 || n % 10 === 3) && (n % 100 !== 12 && n % 100 !== 13) ? few
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var n = +s;
    return n === 1 || n === 3 ? one
      : n === 2 ? two
      : n === 4 ? few
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var n = +s;
    return n === 0 || n === 7 || n === 8 || n === 9 ? zero
      : n === 1 ? one
      : n === 2 ? two
      : n === 3 || n === 4 ? few
      : n === 5 || n === 6 ? many
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var n = +s;
    return n % 10 === 1 && n % 100 !== 11 ? one
      : n % 10 === 2 && n % 100 !== 12 ? two
      : n % 10 === 3 && n % 100 !== 13 ? few
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var n = +s;
    return n === 1 || n === 11 ? one
      : n === 2 || n === 12 ? two
      : n === 3 || n === 13 ? few
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var n = +s;
    return n === 1 ? one
      : n === 2 || n === 3 ? two
      : n === 4 ? few
      : n === 6 ? many
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var n = +s;
    return n === 1 || n === 5 ? one
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var n = +s;
    return n === 11 || n === 8 || n === 80 || n === 800 ? many
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var i = Math.floor(Math.abs(+s));
    return i === 1 ? one
      : i === 0 || ((2 <= i % 100 && i % 100 <= 20) || i % 100 === 40 || i % 100 === 60 || i % 100 === 80) ? many
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var n = +s;
    return n % 10 === 6 || n % 10 === 9 || n % 10 === 0 && n !== 0 ? many
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var i = Math.floor(Math.abs(+s));
    return i % 10 === 1 && i % 100 !== 11 ? one
      : i % 10 === 2 && i % 100 !== 12 ? two
      : (i % 10 === 7 || i % 10 === 8) && (i % 100 !== 17 && i % 100 !== 18) ? many
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var n = +s;
    return n === 1 ? one
      : n === 2 || n === 3 ? two
      : n === 4 ? few
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var n = +s;
    return 1 <= n && n <= 4 ? one
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var n = +s;
    return (n === 1 || n === 5 || (7 <= n && n <= 9)) ? one
      : n === 2 || n === 3 ? two
      : n === 4 ? few
      : n === 6 ? many
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var n = +s;
    return n === 1 ? one
      : n % 10 === 4 && n % 100 !== 14 ? many
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var n = +s;
    return (n % 10 === 1 || n % 10 === 2) && (n % 100 !== 11 && n % 100 !== 12) ? one
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var n = +s;
    return (n % 10 === 6 || n % 10 === 9) || n === 10 ? few
      : other
  },
  function (s/*: string | number */)/*: Rule */ {
    var n = +s;
    return n % 10 === 3 && n % 100 !== 13 ? few
      : other
  }
];

var plurals = {
  af: { cardinal: f[0] },
  ak: { cardinal: f[1] },
  am: { cardinal: f[2] },
  ar: { cardinal: f[3] },
  ars: { cardinal: f[3] },
  as: { cardinal: f[2], ordinal: f[34] },
  asa: { cardinal: f[0] },
  ast: { cardinal: f[4] },
  az: { cardinal: f[0], ordinal: f[35] },
  be: { cardinal: f[5], ordinal: f[36] },
  bem: { cardinal: f[0] },
  bez: { cardinal: f[0] },
  bg: { cardinal: f[0] },
  bh: { cardinal: f[1] },
  bn: { cardinal: f[2], ordinal: f[34] },
  br: { cardinal: f[6] },
  brx: { cardinal: f[0] },
  bs: { cardinal: f[7] },
  ca: { cardinal: f[4], ordinal: f[37] },
  ce: { cardinal: f[0] },
  cgg: { cardinal: f[0] },
  chr: { cardinal: f[0] },
  ckb: { cardinal: f[0] },
  cs: { cardinal: f[8] },
  cy: { cardinal: f[9], ordinal: f[38] },
  da: { cardinal: f[10] },
  de: { cardinal: f[4] },
  dsb: { cardinal: f[11] },
  dv: { cardinal: f[0] },
  ee: { cardinal: f[0] },
  el: { cardinal: f[0] },
  en: { cardinal: f[4], ordinal: f[39] },
  eo: { cardinal: f[0] },
  es: { cardinal: f[0] },
  et: { cardinal: f[4] },
  eu: { cardinal: f[0] },
  fa: { cardinal: f[2] },
  ff: { cardinal: f[12] },
  fi: { cardinal: f[4] },
  fil: { cardinal: f[13], ordinal: f[0] },
  fo: { cardinal: f[0] },
  fr: { cardinal: f[12], ordinal: f[0] },
  fur: { cardinal: f[0] },
  fy: { cardinal: f[4] },
  ga: { cardinal: f[14], ordinal: f[0] },
  gd: { cardinal: f[15], ordinal: f[40] },
  gl: { cardinal: f[4] },
  gsw: { cardinal: f[0] },
  gu: { cardinal: f[2], ordinal: f[41] },
  guw: { cardinal: f[1] },
  gv: { cardinal: f[16] },
  ha: { cardinal: f[0] },
  haw: { cardinal: f[0] },
  he: { cardinal: f[17] },
  hi: { cardinal: f[2], ordinal: f[41] },
  hr: { cardinal: f[7] },
  hsb: { cardinal: f[11] },
  hu: { cardinal: f[0], ordinal: f[42] },
  hy: { cardinal: f[12], ordinal: f[0] },
  ia: { cardinal: f[4] },
  io: { cardinal: f[4] },
  is: { cardinal: f[18] },
  it: { cardinal: f[4], ordinal: f[43] },
  iu: { cardinal: f[19] },
  iw: { cardinal: f[17] },
  jgo: { cardinal: f[0] },
  ji: { cardinal: f[4] },
  jmc: { cardinal: f[0] },
  ka: { cardinal: f[0], ordinal: f[44] },
  kab: { cardinal: f[12] },
  kaj: { cardinal: f[0] },
  kcg: { cardinal: f[0] },
  kk: { cardinal: f[0], ordinal: f[45] },
  kkj: { cardinal: f[0] },
  kl: { cardinal: f[0] },
  kn: { cardinal: f[2] },
  ks: { cardinal: f[0] },
  ksb: { cardinal: f[0] },
  ksh: { cardinal: f[20] },
  ku: { cardinal: f[0] },
  kw: { cardinal: f[19] },
  ky: { cardinal: f[0] },
  lag: { cardinal: f[21] },
  lb: { cardinal: f[0] },
  lg: { cardinal: f[0] },
  ln: { cardinal: f[1] },
  lt: { cardinal: f[22] },
  lv: { cardinal: f[23] },
  mas: { cardinal: f[0] },
  mg: { cardinal: f[1] },
  mgo: { cardinal: f[0] },
  mk: { cardinal: f[24], ordinal: f[46] },
  ml: { cardinal: f[0] },
  mn: { cardinal: f[0] },
  mo: { cardinal: f[25], ordinal: f[0] },
  mr: { cardinal: f[2], ordinal: f[47] },
  mt: { cardinal: f[26] },
  nah: { cardinal: f[0] },
  naq: { cardinal: f[19] },
  nb: { cardinal: f[0] },
  nd: { cardinal: f[0] },
  ne: { cardinal: f[0], ordinal: f[48] },
  nl: { cardinal: f[4] },
  nn: { cardinal: f[0] },
  nnh: { cardinal: f[0] },
  no: { cardinal: f[0] },
  nr: { cardinal: f[0] },
  nso: { cardinal: f[1] },
  ny: { cardinal: f[0] },
  nyn: { cardinal: f[0] },
  om: { cardinal: f[0] },
  or: { cardinal: f[0], ordinal: f[49] },
  os: { cardinal: f[0] },
  pa: { cardinal: f[1] },
  pap: { cardinal: f[0] },
  pl: { cardinal: f[27] },
  prg: { cardinal: f[23] },
  ps: { cardinal: f[0] },
  pt: { cardinal: f[28] },
  'pt-PT': { cardinal: f[4] },
  rm: { cardinal: f[0] },
  ro: { cardinal: f[25], ordinal: f[0] },
  rof: { cardinal: f[0] },
  ru: { cardinal: f[29] },
  rwk: { cardinal: f[0] },
  saq: { cardinal: f[0] },
  sc: { cardinal: f[4], ordinal: f[43] },
  scn: { cardinal: f[4], ordinal: f[43] },
  sd: { cardinal: f[0] },
  sdh: { cardinal: f[0] },
  se: { cardinal: f[19] },
  seh: { cardinal: f[0] },
  sh: { cardinal: f[7] },
  shi: { cardinal: f[30] },
  si: { cardinal: f[31] },
  sk: { cardinal: f[8] },
  sl: { cardinal: f[32] },
  sma: { cardinal: f[19] },
  smi: { cardinal: f[19] },
  smj: { cardinal: f[19] },
  smn: { cardinal: f[19] },
  sms: { cardinal: f[19] },
  sn: { cardinal: f[0] },
  so: { cardinal: f[0] },
  sq: { cardinal: f[0], ordinal: f[50] },
  sr: { cardinal: f[7] },
  ss: { cardinal: f[0] },
  ssy: { cardinal: f[0] },
  st: { cardinal: f[0] },
  sv: { cardinal: f[4], ordinal: f[51] },
  sw: { cardinal: f[4] },
  syr: { cardinal: f[0] },
  ta: { cardinal: f[0] },
  te: { cardinal: f[0] },
  teo: { cardinal: f[0] },
  ti: { cardinal: f[1] },
  tig: { cardinal: f[0] },
  tk: { cardinal: f[0], ordinal: f[52] },
  tl: { cardinal: f[13], ordinal: f[0] },
  tn: { cardinal: f[0] },
  tr: { cardinal: f[0] },
  ts: { cardinal: f[0] },
  tzm: { cardinal: f[33] },
  ug: { cardinal: f[0] },
  uk: { cardinal: f[29], ordinal: f[53] },
  ur: { cardinal: f[4] },
  uz: { cardinal: f[0] },
  ve: { cardinal: f[0] },
  vo: { cardinal: f[0] },
  vun: { cardinal: f[0] },
  wa: { cardinal: f[1] },
  wae: { cardinal: f[0] },
  xh: { cardinal: f[0] },
  xog: { cardinal: f[0] },
  yi: { cardinal: f[4] },
  zu: { cardinal: f[2] },
  lo: { ordinal: f[0] },
  ms: { ordinal: f[0] },
  vi: { ordinal: f[0] }
};

var formatMessageInterpret = createCommonjsModule(function (module, exports) {




/*::
import type {
  AST,
  SubMessages
} from '../format-message-parse'
type Locale = string
type Locales = Locale | Locale[]
type Placeholder = any[] // https://github.com/facebook/flow/issues/4050
export type Type = (Placeholder, Locales) => (any, ?Object) => any
export type Types = { [string]: Type }
*/

exports = module.exports = function interpret (
  ast/*: AST */,
  locale/*:: ?: Locales */,
  types/*:: ?: Types */
)/*: (args?: Object) => string */ {
  return interpretAST(ast, null, locale || 'en', types || {}, true)
};

exports.toParts = function toParts (
  ast/*: AST */,
  locale/*:: ?: Locales */,
  types/*:: ?: Types */
)/*: (args?: Object) => any[] */ {
  return interpretAST(ast, null, locale || 'en', types || {}, false)
};

function interpretAST (
  elements/*: any[] */,
  parent/*: ?Placeholder */,
  locale/*: Locales */,
  types/*: Types */,
  join/*: boolean */
)/*: Function */ {
  var parts = elements.map(function (element) {
    return interpretElement(element, parent, locale, types, join)
  });

  if (!join) {
    return function format (args) {
      return parts.reduce(function (parts, part) {
        return parts.concat(part(args))
      }, [])
    }
  }

  if (parts.length === 1) return parts[0]
  return function format (args) {
    var message = '';
    for (var e = 0; e < parts.length; ++e) {
      message += parts[e](args);
    }
    return message
  }
}

function interpretElement (
  element/*: Placeholder */,
  parent/*: ?Placeholder */,
  locale/*: Locales */,
  types/*: Types */,
  join/*: boolean */
)/*: Function */ {
  if (typeof element === 'string') {
    var value/*: string */ = element;
    return function format () { return value }
  }

  var id = element[0];
  var type = element[1];

  if (parent && element[0] === '#') {
    id = parent[0];
    var offset = parent[2];
    var formatter = (types.number || defaults.number)([ id, 'number' ], locale);
    return function format (args) {
      return formatter(getArg(id, args) - offset, args)
    }
  }

  // pre-process children
  var children;
  if (type === 'plural' || type === 'selectordinal') {
    children = {};
    Object.keys(element[3]).forEach(function (key) {
      children[key] = interpretAST(element[3][key], element, locale, types, join);
    });
    element = [ element[0], element[1], element[2], children ];
  } else if (element[2] && typeof element[2] === 'object') {
    children = {};
    Object.keys(element[2]).forEach(function (key) {
      children[key] = interpretAST(element[2][key], element, locale, types, join);
    });
    element = [ element[0], element[1], children ];
  }

  var getFrmt = type && (types[type] || defaults[type]);
  if (getFrmt) {
    var frmt = getFrmt(element, locale);
    return function format (args) {
      return frmt(getArg(id, args), args)
    }
  }

  return join
    ? function format (args) { return String(getArg(id, args)) }
    : function format (args) { return getArg(id, args) }
}

function getArg (id/*: string */, args/*: ?Object */)/*: any */ {
  if (args && (id in args)) return args[id]
  var parts = id.split('.');
  var a = args;
  for (var i = 0, ii = parts.length; a && i < ii; ++i) {
    a = a[parts[i]];
  }
  return a
}

function interpretNumber (element/*: Placeholder */, locales/*: Locales */) {
  var style = element[2];
  var options = formatMessageFormats.number[style] || formatMessageFormats.parseNumberPattern(style) || formatMessageFormats.number.default;
  return new Intl.NumberFormat(locales, options).format
}

function interpretDuration (element/*: Placeholder */, locales/*: Locales */) {
  var style = element[2];
  var options = formatMessageFormats.duration[style] || formatMessageFormats.duration.default;
  var fs = new Intl.NumberFormat(locales, options.seconds).format;
  var fm = new Intl.NumberFormat(locales, options.minutes).format;
  var fh = new Intl.NumberFormat(locales, options.hours).format;
  var sep = /^fi$|^fi-|^da/.test(String(locales)) ? '.' : ':';

  return function (s, args) {
    s = +s;
    if (!isFinite(s)) return fs(s)
    var h = ~~(s / 60 / 60); // ~~ acts much like Math.trunc
    var m = ~~(s / 60 % 60);
    var dur = (h ? (fh(Math.abs(h)) + sep) : '') +
      fm(Math.abs(m)) + sep + fs(Math.abs(s % 60));
    return s < 0 ? fh(-1).replace(fh(1), dur) : dur
  }
}

function interpretDateTime (element/*: Placeholder */, locales/*: Locales */) {
  var type = element[1];
  var style = element[2];
  var options = formatMessageFormats[type][style] || formatMessageFormats.parseDatePattern(style) || formatMessageFormats[type].default;
  return new Intl.DateTimeFormat(locales, options).format
}

function interpretPlural (element/*: Placeholder */, locales/*: Locales */) {
  var type = element[1];
  var pluralType = type === 'selectordinal' ? 'ordinal' : 'cardinal';
  var offset = element[2];
  var children = element[3];
  var pluralRules;
  if (Intl.PluralRules && Intl.PluralRules.supportedLocalesOf(locales).length > 0) {
    pluralRules = new Intl.PluralRules(locales, { type: pluralType });
  } else {
    var locale = lookupClosestLocale(locales, plurals);
    var select = (locale && plurals[locale][pluralType]) || returnOther;
    pluralRules = { select: select };
  }

  return function (value, args) {
    var clause =
      children['=' + +value] ||
      children[pluralRules.select(value - offset)] ||
      children.other;
    return clause(args)
  }
}

function returnOther (/*:: n:number */) { return 'other' }

function interpretSelect (element/*: Placeholder */, locales/*: Locales */) {
  var children = element[2];
  return function (value, args) {
    var clause = children[value] || children.other;
    return clause(args)
  }
}

var defaults/*: Types */ = {
  number: interpretNumber,
  ordinal: interpretNumber, // TODO: support rbnf
  spellout: interpretNumber, // TODO: support rbnf
  duration: interpretDuration,
  date: interpretDateTime,
  time: interpretDateTime,
  plural: interpretPlural,
  selectordinal: interpretPlural,
  select: interpretSelect
};
exports.types = defaults;
});

var formatMessage = createCommonjsModule(function (module, exports) {






/*::
import type { Types } from 'format-message-interpret'
type Locale = string
type Locales = Locale | Locale[]
type Message = string | {|
  id?: string,
  default: string,
  description?: string
|}
type Translations = { [string]: ?{ [string]: string | Translation } }
type Translation = {
  message: string,
  format?: (args?: Object) => string,
  toParts?: (args?: Object) => any[],
}
type Replacement = ?string | (string, string, locales?: Locales) => ?string
type GenerateId = (string) => string
type MissingTranslation = 'ignore' | 'warning' | 'error'
type FormatObject = { [string]: * }
type Options = {
  locale?: Locales,
  translations?: ?Translations,
  generateId?: GenerateId,
  missingReplacement?: Replacement,
  missingTranslation?: MissingTranslation,
  formats?: {
    number?: FormatObject,
    date?: FormatObject,
    time?: FormatObject
  },
  types?: Types
}
type Setup = {|
  locale: Locales,
  translations: Translations,
  generateId: GenerateId,
  missingReplacement: Replacement,
  missingTranslation: MissingTranslation,
  formats: {
    number: FormatObject,
    date: FormatObject,
    time: FormatObject
  },
  types: Types
|}
type FormatMessage = {
  (msg: Message, args?: Object, locales?: Locales): string,
  rich (msg: Message, args?: Object, locales?: Locales): any[],
  setup (opt?: Options): Setup,
  number (value: number, style?: string, locales?: Locales): string,
  date (value: number | Date, style?: string, locales?: Locales): string,
  time (value: number | Date, style?: string, locales?: Locales): string,
  select (value: any, options: Object): any,
  custom (placeholder: any[], locales: Locales, value: any, args: Object): any,
  plural (value: number, offset: any, options: any, locale: any): any,
  selectordinal (value: number, offset: any, options: any, locale: any): any,
  namespace (): FormatMessage
}
*/

function assign/*:: <T: Object> */ (target/*: T */, source/*: Object */) {
  Object.keys(source).forEach(function (key) { target[key] = source[key]; });
  return target
}

function namespace ()/*: FormatMessage */ {
  var formats = assign({}, formatMessageFormats);
  var currentLocales/*: Locales */ = 'en';
  var translations/*: Translations */ = {};
  var generateId/*: GenerateId */ = function (pattern) { return pattern };
  var missingReplacement/*: Replacement */ = null;
  var missingTranslation/*: MissingTranslation */ = 'warning';
  var types/*: Types */ = {};

  function formatMessage (msg/*: Message */, args/*:: ?: Object */, locales/*:: ?: Locales */) {
    var pattern = typeof msg === 'string' ? msg : msg.default;
    var id = (typeof msg === 'object' && msg.id) || generateId(pattern);
    var translated = translate(pattern, id, locales || currentLocales);
    var format = translated.format || (
      translated.format = formatMessageInterpret(formatMessageParse(translated.message), locales || currentLocales, types)
    );
    return format(args)
  }

  formatMessage.rich = function rich (msg/*: Message */, args/*:: ?: Object */, locales/*:: ?: Locales */) {
    var pattern = typeof msg === 'string' ? msg : msg.default;
    var id = (typeof msg === 'object' && msg.id) || generateId(pattern);
    var translated = translate(pattern, id, locales || currentLocales);
    var format = translated.toParts || (
      translated.toParts = formatMessageInterpret.toParts(formatMessageParse(translated.message, { tagsType: tagsType }), locales || currentLocales, types)
    );
    return format(args)
  };

  var tagsType = '<>';
  function richType (node/*: any[] */, locales/*: Locales */) {
    var style = node[2];
    return function (fn, args) {
      var props = typeof style === 'object' ? mapObject(style, args) : style;
      return typeof fn === 'function' ? fn(props) : fn
    }
  }
  types[tagsType] = richType;

  function mapObject (object/* { [string]: (args?: Object) => any } */, args/*: ?Object */) {
    return Object.keys(object).reduce(function (mapped, key) {
      mapped[key] = object[key](args);
      return mapped
    }, {})
  }

  function translate (pattern/*: string */, id/*: string */, locales/*: Locales */)/*: Translation */ {
    var locale = lookupClosestLocale(locales, translations) || 'en';
    var messages = translations[locale] || (translations[locale] = {});
    var translated = messages[id];
    if (typeof translated === 'string') {
      translated = messages[id] = { message: translated };
    }
    if (!translated) {
      var message = 'Translation for "' + id + '" in "' + locale + '" is missing';
      if (missingTranslation === 'warning') {
        /* istanbul ignore else */
        if (typeof console !== 'undefined') console.warn(message);
      } else if (missingTranslation !== 'ignore') { // 'error'
        throw new Error(message)
      }
      var replacement = typeof missingReplacement === 'function'
        ? missingReplacement(pattern, id, locale) || pattern
        : missingReplacement || pattern;
      translated = messages[id] = { message: replacement };
    }
    return translated
  }

  formatMessage.setup = function setup (opt/*:: ?: Options */) {
    opt = opt || {};
    if (opt.locale) currentLocales = opt.locale;
    if ('translations' in opt) translations = opt.translations || {};
    if (opt.generateId) generateId = opt.generateId;
    if ('missingReplacement' in opt) missingReplacement = opt.missingReplacement;
    if (opt.missingTranslation) missingTranslation = opt.missingTranslation;
    if (opt.formats) {
      if (opt.formats.number) assign(formats.number, opt.formats.number);
      if (opt.formats.date) assign(formats.date, opt.formats.date);
      if (opt.formats.time) assign(formats.time, opt.formats.time);
    }
    if (opt.types) {
      types = opt.types;
      types[tagsType] = richType;
    }
    return {
      locale: currentLocales,
      translations: translations,
      generateId: generateId,
      missingReplacement: missingReplacement,
      missingTranslation: missingTranslation,
      formats: formats,
      types: types
    }
  };

  formatMessage.number = function (value/*: number */, style/*:: ?: string */, locales/*:: ?: Locales */) {
    var options = (style && formats.number[style]) ||
      formats.parseNumberPattern(style) ||
      formats.number.default;
    return new Intl.NumberFormat(locales || currentLocales, options).format(value)
  };

  formatMessage.date = function (value/*:: ?: number | Date */, style/*:: ?: string */, locales/*:: ?: Locales */) {
    var options = (style && formats.date[style]) ||
      formats.parseDatePattern(style) ||
      formats.date.default;
    return new Intl.DateTimeFormat(locales || currentLocales, options).format(value)
  };

  formatMessage.time = function (value/*:: ?: number | Date */, style/*:: ?: string */, locales/*:: ?: Locales */) {
    var options = (style && formats.time[style]) ||
      formats.parseDatePattern(style) ||
      formats.time.default;
    return new Intl.DateTimeFormat(locales || currentLocales, options).format(value)
  };

  formatMessage.select = function (value/*: any */, options/*: Object */) {
    return options[value] || options.other
  };

  formatMessage.custom = function (placeholder/*: any[] */, locales/*: Locales */, value/*: any */, args/*: Object */) {
    if (!(placeholder[1] in types)) return value
    return types[placeholder[1]](placeholder, locales)(value, args)
  };

  formatMessage.plural = plural.bind(null, 'cardinal');
  formatMessage.selectordinal = plural.bind(null, 'ordinal');
  function plural (
    pluralType/*: 'cardinal' | 'ordinal' */,
    value/*: number */,
    offset/*: any */,
    options/*: any */,
    locale/*: any */
  ) {
    if (typeof offset === 'object' && typeof options !== 'object') { // offset is optional
      locale = options;
      options = offset;
      offset = 0;
    }
    var closest = lookupClosestLocale(locale || currentLocales, plurals);
    var plural = (closest && plurals[closest][pluralType]) || returnOther;
    return options['=' + +value] || options[plural(value - offset)] || options.other
  }
  function returnOther (/*:: n:number */) { return 'other' }

  formatMessage.namespace = namespace;

  return formatMessage
}

module.exports = exports = namespace();
});

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

var buildKey = function (base, curr) { return base ? base + "." + curr : curr; };
var flatObject = function (object) {
    var result = {};
    var iterate = function (item, currentKey) {
        Object.keys(item).forEach(function (key) {
            var value = item[key];
            if (typeof value === 'object')
                iterate(value, buildKey(currentKey, key));
            else
                result[buildKey(currentKey, key)] = value;
        });
    };
    iterate(object, '');
    return result;
};

var flatTranslation = function (translations) { return Object.keys(translations).reduce(function (acc, key) {
    var _a;
    return (__assign(__assign({}, acc), (_a = {}, _a[key] = flatObject(translations[key]), _a)));
}, {}); };
var merge = function (obj1, obj2) {
    if (obj1 === void 0) { obj1 = {}; }
    return Object.keys(obj2).reduce(function (acc, key) {
        if (obj2[key] !== null && typeof obj2[key] === 'object') {
            acc[key] = merge(acc[key], obj2[key]);
        }
        else {
            acc[key] = obj2[key];
        }
        return acc;
    }, obj1);
};
function createMergeableStore(defaultValue) {
    var _a = writable(defaultValue), subscribe = _a.subscribe, set = _a.set, update = _a.update;
    var updateMerging = function (newTranslations) { return update(function ($translations) {
        return merge($translations, newTranslations);
    }); };
    return {
        set: set,
        subscribe: subscribe,
        update: updateMerging,
    };
}
var defaultOptions = {
    missingTranslation: 'ignore',
};
var options = createMergeableStore(defaultOptions);
var translations = createMergeableStore({});
var locales = derived(translations, function ($translations) { return Object.keys($translations); });
var createLocale = function () {
    var _a = writable(''), subscribe = _a.subscribe, set = _a.set, update = _a.update;
    var setLocale = function (newLocale) {
        if (newLocale !== '' && !get_store_value(translations)[newLocale]) {
            console.error("[svelte-intl] Couldn't find the \"" + newLocale + "\" locale.");
            return false;
        }
        set(newLocale);
        return true;
    };
    return {
        subscribe: subscribe,
        update: update,
        set: setLocale,
    };
};
var locale = createLocale();
var translate = derived([locale, translations, options], function (stores) {
    var $locale = stores[0], $translations = stores[1], $options = stores[2];
    formatMessage.setup(__assign(__assign({}, $options), { locale: $locale, translations: flatTranslation($translations) }));
    return formatMessage;
});
var _ = translate;

const CONTEXT_KEY = {};

/* site/src/routes/_layout.svelte generated by Svelte v3.29.0 */
const get_default_slot_changes = dirty => ({ segment: dirty & /*segment*/ 1 });
const get_default_slot_context = ctx => ({ segment: /*segment*/ ctx[0] });

// (34:0) {#if $locale}
function create_if_block(ctx) {
	let main;
	let current;
	const default_slot_template = /*#slots*/ ctx[3].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], get_default_slot_context);

	return {
		c() {
			main = element("main");
			if (default_slot) default_slot.c();
		},
		l(nodes) {
			main = claim_element(nodes, "MAIN", {});
			var main_nodes = children(main);
			if (default_slot) default_slot.l(main_nodes);
			main_nodes.forEach(detach);
		},
		m(target, anchor) {
			insert(target, main, anchor);

			if (default_slot) {
				default_slot.m(main, null);
			}

			current = true;
		},
		p(ctx, dirty) {
			if (default_slot) {
				if (default_slot.p && dirty & /*$$scope, segment*/ 5) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[2], dirty, get_default_slot_changes, get_default_slot_context);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(main);
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function create_fragment(ctx) {
	let if_block_anchor;
	let current;
	let if_block = /*$locale*/ ctx[1] && create_if_block(ctx);

	return {
		c() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		l(nodes) {
			if (if_block) if_block.l(nodes);
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			if (/*$locale*/ ctx[1]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*$locale*/ 2) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let $locale;
	component_subscribe($$self, locale, $$value => $$invalidate(1, $locale = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	let { segment } = $$props;

	$$self.$$set = $$props => {
		if ("segment" in $$props) $$invalidate(0, segment = $$props.segment);
		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
	};

	return [segment, $locale, $$scope, slots];
}

class Layout extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, { segment: 0 });
	}
}

var root_comp = /*#__PURE__*/Object.freeze({
    __proto__: null,
    'default': Layout
});

/* site/src/node_modules/@sapper/internal/error.svelte generated by Svelte v3.29.0 */

function create_fragment$1(ctx) {
	let h1;
	let t0;
	let t1;
	let p;
	let t2_value = /*error*/ ctx[0].message + "";
	let t2;
	let t3;
	let if_block_anchor;

	return {
		c() {
			h1 = element("h1");
			t0 = text(/*status*/ ctx[1]);
			t1 = space();
			p = element("p");
			t2 = text(t2_value);
			t3 = space();
			if_block_anchor = empty();
		},
		l(nodes) {
			h1 = claim_element(nodes, "H1", {});
			var h1_nodes = children(h1);
			t0 = claim_text(h1_nodes, /*status*/ ctx[1]);
			h1_nodes.forEach(detach);
			t1 = claim_space(nodes);
			p = claim_element(nodes, "P", {});
			var p_nodes = children(p);
			t2 = claim_text(p_nodes, t2_value);
			p_nodes.forEach(detach);
			t3 = claim_space(nodes);
			if_block_anchor = empty();
		},
		m(target, anchor) {
			insert(target, h1, anchor);
			append(h1, t0);
			insert(target, t1, anchor);
			insert(target, p, anchor);
			append(p, t2);
			insert(target, t3, anchor);
			insert(target, if_block_anchor, anchor);
		},
		p(ctx, [dirty]) {
			if (dirty & /*status*/ 2) set_data(t0, /*status*/ ctx[1]);
			if (dirty & /*error*/ 1 && t2_value !== (t2_value = /*error*/ ctx[0].message + "")) set_data(t2, t2_value);
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(h1);
			if (detaching) detach(t1);
			if (detaching) detach(p);
			if (detaching) detach(t3);
			if (detaching) detach(if_block_anchor);
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	let { error } = $$props;
	let { status } = $$props;

	$$self.$$set = $$props => {
		if ("error" in $$props) $$invalidate(0, error = $$props.error);
		if ("status" in $$props) $$invalidate(1, status = $$props.status);
	};

	return [error, status];
}

class Error$1 extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$1, create_fragment$1, safe_not_equal, { error: 0, status: 1 });
	}
}

/* site/src/node_modules/@sapper/internal/App.svelte generated by Svelte v3.29.0 */

function create_else_block(ctx) {
	let switch_instance;
	let switch_instance_anchor;
	let current;
	const switch_instance_spread_levels = [/*level1*/ ctx[4].props];
	var switch_value = /*level1*/ ctx[4].component;

	function switch_props(ctx) {
		let switch_instance_props = {};

		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
		}

		return { props: switch_instance_props };
	}

	if (switch_value) {
		switch_instance = new switch_value(switch_props());
	}

	return {
		c() {
			if (switch_instance) create_component(switch_instance.$$.fragment);
			switch_instance_anchor = empty();
		},
		l(nodes) {
			if (switch_instance) claim_component(switch_instance.$$.fragment, nodes);
			switch_instance_anchor = empty();
		},
		m(target, anchor) {
			if (switch_instance) {
				mount_component(switch_instance, target, anchor);
			}

			insert(target, switch_instance_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const switch_instance_changes = (dirty & /*level1*/ 16)
			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*level1*/ ctx[4].props)])
			: {};

			if (switch_value !== (switch_value = /*level1*/ ctx[4].component)) {
				if (switch_instance) {
					group_outros();
					const old_component = switch_instance;

					transition_out(old_component.$$.fragment, 1, 0, () => {
						destroy_component(old_component, 1);
					});

					check_outros();
				}

				if (switch_value) {
					switch_instance = new switch_value(switch_props());
					create_component(switch_instance.$$.fragment);
					transition_in(switch_instance.$$.fragment, 1);
					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
				} else {
					switch_instance = null;
				}
			} else if (switch_value) {
				switch_instance.$set(switch_instance_changes);
			}
		},
		i(local) {
			if (current) return;
			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
			current = true;
		},
		o(local) {
			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(switch_instance_anchor);
			if (switch_instance) destroy_component(switch_instance, detaching);
		}
	};
}

// (21:1) {#if error}
function create_if_block$1(ctx) {
	let error_1;
	let current;

	error_1 = new Error$1({
			props: {
				error: /*error*/ ctx[0],
				status: /*status*/ ctx[1]
			}
		});

	return {
		c() {
			create_component(error_1.$$.fragment);
		},
		l(nodes) {
			claim_component(error_1.$$.fragment, nodes);
		},
		m(target, anchor) {
			mount_component(error_1, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const error_1_changes = {};
			if (dirty & /*error*/ 1) error_1_changes.error = /*error*/ ctx[0];
			if (dirty & /*status*/ 2) error_1_changes.status = /*status*/ ctx[1];
			error_1.$set(error_1_changes);
		},
		i(local) {
			if (current) return;
			transition_in(error_1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(error_1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(error_1, detaching);
		}
	};
}

// (20:0) <Layout segment="{segments[0]}" {...level0.props}>
function create_default_slot(ctx) {
	let current_block_type_index;
	let if_block;
	let if_block_anchor;
	let current;
	const if_block_creators = [create_if_block$1, create_else_block];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*error*/ ctx[0]) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c() {
			if_block.c();
			if_block_anchor = empty();
		},
		l(nodes) {
			if_block.l(nodes);
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if_blocks[current_block_type_index].m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(ctx, dirty);
			} else {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block = if_blocks[current_block_type_index];

				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				}

				transition_in(if_block, 1);
				if_block.m(if_block_anchor.parentNode, if_block_anchor);
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if_blocks[current_block_type_index].d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

function create_fragment$2(ctx) {
	let layout;
	let current;
	const layout_spread_levels = [{ segment: /*segments*/ ctx[2][0] }, /*level0*/ ctx[3].props];

	let layout_props = {
		$$slots: { default: [create_default_slot] },
		$$scope: { ctx }
	};

	for (let i = 0; i < layout_spread_levels.length; i += 1) {
		layout_props = assign(layout_props, layout_spread_levels[i]);
	}

	layout = new Layout({ props: layout_props });

	return {
		c() {
			create_component(layout.$$.fragment);
		},
		l(nodes) {
			claim_component(layout.$$.fragment, nodes);
		},
		m(target, anchor) {
			mount_component(layout, target, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			const layout_changes = (dirty & /*segments, level0*/ 12)
			? get_spread_update(layout_spread_levels, [
					dirty & /*segments*/ 4 && { segment: /*segments*/ ctx[2][0] },
					dirty & /*level0*/ 8 && get_spread_object(/*level0*/ ctx[3].props)
				])
			: {};

			if (dirty & /*$$scope, error, status, level1*/ 147) {
				layout_changes.$$scope = { dirty, ctx };
			}

			layout.$set(layout_changes);
		},
		i(local) {
			if (current) return;
			transition_in(layout.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(layout.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(layout, detaching);
		}
	};
}

function instance$2($$self, $$props, $$invalidate) {
	let { stores } = $$props;
	let { error } = $$props;
	let { status } = $$props;
	let { segments } = $$props;
	let { level0 } = $$props;
	let { level1 = null } = $$props;
	let { notify } = $$props;
	afterUpdate(notify);
	setContext(CONTEXT_KEY, stores);

	$$self.$$set = $$props => {
		if ("stores" in $$props) $$invalidate(5, stores = $$props.stores);
		if ("error" in $$props) $$invalidate(0, error = $$props.error);
		if ("status" in $$props) $$invalidate(1, status = $$props.status);
		if ("segments" in $$props) $$invalidate(2, segments = $$props.segments);
		if ("level0" in $$props) $$invalidate(3, level0 = $$props.level0);
		if ("level1" in $$props) $$invalidate(4, level1 = $$props.level1);
		if ("notify" in $$props) $$invalidate(6, notify = $$props.notify);
	};

	return [error, status, segments, level0, level1, stores, notify];
}

class App extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
			stores: 5,
			error: 0,
			status: 1,
			segments: 2,
			level0: 3,
			level1: 4,
			notify: 6
		});
	}
}

// This file is generated by Sapper — do not edit it!

const ignore = [];

const components = [
	{
		js: () => Promise.all([import('./index.80afd2d9.js'), __inject_styles(["client-26d758fe.css","index-389e76af.css"])]).then(function(x) { return x[0]; })
	}
];

const routes = [
	{
		// index.svelte
		pattern: /^\/$/,
		parts: [
			{ i: 0 }
		]
	}
];

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function find_anchor(node) {
    while (node && node.nodeName.toUpperCase() !== 'A')
        node = node.parentNode; // SVG <a> elements have a lowercase name
    return node;
}

let uid = 1;
function set_uid(n) {
    uid = n;
}
let cid;
function set_cid(n) {
    cid = n;
}
const _history = typeof history !== 'undefined' ? history : {
    pushState: () => { },
    replaceState: () => { },
    scrollRestoration: 'auto'
};
const scroll_history = {};
function load_current_page() {
    return Promise.resolve().then(() => {
        const { hash, href } = location;
        _history.replaceState({ id: uid }, '', href);
        const target = select_target(new URL(location.href));
        if (target)
            return navigate(target, uid, true, hash);
    });
}
let base_url;
let handle_target;
function init$1(base, handler) {
    base_url = base;
    handle_target = handler;
    if ('scrollRestoration' in _history) {
        _history.scrollRestoration = 'manual';
    }
    // Adopted from Nuxt.js
    // Reset scrollRestoration to auto when leaving page, allowing page reload
    // and back-navigation from other pages to use the browser to restore the
    // scrolling position.
    addEventListener('beforeunload', () => {
        _history.scrollRestoration = 'auto';
    });
    // Setting scrollRestoration to manual again when returning to this page.
    addEventListener('load', () => {
        _history.scrollRestoration = 'manual';
    });
    addEventListener('click', handle_click);
    addEventListener('popstate', handle_popstate);
}
function extract_query(search) {
    const query = Object.create(null);
    if (search.length > 0) {
        search.slice(1).split('&').forEach(searchParam => {
            const [, key, value = ''] = /([^=]*)(?:=(.*))?/.exec(decodeURIComponent(searchParam.replace(/\+/g, ' ')));
            if (typeof query[key] === 'string')
                query[key] = [query[key]];
            if (typeof query[key] === 'object')
                query[key].push(value);
            else
                query[key] = value;
        });
    }
    return query;
}
function select_target(url) {
    if (url.origin !== location.origin)
        return null;
    if (!url.pathname.startsWith(base_url))
        return null;
    let path = url.pathname.slice(base_url.length);
    if (path === '') {
        path = '/';
    }
    // avoid accidental clashes between server routes and page routes
    if (ignore.some(pattern => pattern.test(path)))
        return;
    for (let i = 0; i < routes.length; i += 1) {
        const route = routes[i];
        const match = route.pattern.exec(path);
        if (match) {
            const query = extract_query(url.search);
            const part = route.parts[route.parts.length - 1];
            const params = part.params ? part.params(match) : {};
            const page = { host: location.host, path, query, params };
            return { href: url.href, route, match, page };
        }
    }
}
function handle_click(event) {
    // Adapted from https://github.com/visionmedia/page.js
    // MIT license https://github.com/visionmedia/page.js#license
    if (which(event) !== 1)
        return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;
    if (event.defaultPrevented)
        return;
    const a = find_anchor(event.target);
    if (!a)
        return;
    if (!a.href)
        return;
    // check if link is inside an svg
    // in this case, both href and target are always inside an object
    const svg = typeof a.href === 'object' && a.href.constructor.name === 'SVGAnimatedString';
    const href = String(svg ? a.href.baseVal : a.href);
    if (href === location.href) {
        if (!location.hash)
            event.preventDefault();
        return;
    }
    // Ignore if tag has
    // 1. 'download' attribute
    // 2. rel='external' attribute
    if (a.hasAttribute('download') || a.getAttribute('rel') === 'external')
        return;
    // Ignore if <a> has a target
    if (svg ? a.target.baseVal : a.target)
        return;
    const url = new URL(href);
    // Don't handle hash changes
    if (url.pathname === location.pathname && url.search === location.search)
        return;
    const target = select_target(url);
    if (target) {
        const noscroll = a.hasAttribute('sapper:noscroll');
        navigate(target, null, noscroll, url.hash);
        event.preventDefault();
        _history.pushState({ id: cid }, '', url.href);
    }
}
function which(event) {
    return event.which === null ? event.button : event.which;
}
function scroll_state() {
    return {
        x: pageXOffset,
        y: pageYOffset
    };
}
function handle_popstate(event) {
    scroll_history[cid] = scroll_state();
    if (event.state) {
        const url = new URL(location.href);
        const target = select_target(url);
        if (target) {
            navigate(target, event.state.id);
        }
        else {
            // eslint-disable-next-line
            location.href = location.href; // nosonar
        }
    }
    else {
        // hashchange
        set_uid(uid + 1);
        set_cid(uid);
        _history.replaceState({ id: cid }, '', location.href);
    }
}
function navigate(dest, id, noscroll, hash) {
    return __awaiter(this, void 0, void 0, function* () {
        const popstate = !!id;
        if (popstate) {
            cid = id;
        }
        else {
            const current_scroll = scroll_state();
            // clicked on a link. preserve scroll state
            scroll_history[cid] = current_scroll;
            cid = id = ++uid;
            scroll_history[cid] = noscroll ? current_scroll : { x: 0, y: 0 };
        }
        yield handle_target(dest);
        if (document.activeElement && (document.activeElement instanceof HTMLElement))
            document.activeElement.blur();
        if (!noscroll) {
            let scroll = scroll_history[id];
            let deep_linked;
            if (hash) {
                // scroll is an element id (from a hash), we need to compute y.
                deep_linked = document.getElementById(hash.slice(1));
                if (deep_linked) {
                    scroll = {
                        x: 0,
                        y: deep_linked.getBoundingClientRect().top + scrollY
                    };
                }
            }
            scroll_history[cid] = scroll;
            if (popstate || deep_linked) {
                scrollTo(scroll.x, scroll.y);
            }
            else {
                scrollTo(0, 0);
            }
        }
    });
}

function get_base_uri(window_document) {
    let baseURI = window_document.baseURI;
    if (!baseURI) {
        const baseTags = window_document.getElementsByTagName('base');
        baseURI = baseTags.length ? baseTags[0].href : window_document.URL;
    }
    return baseURI;
}

let prefetching = null;
let mousemove_timeout;
function start() {
    addEventListener('touchstart', trigger_prefetch);
    addEventListener('mousemove', handle_mousemove);
}
function prefetch(href) {
    const target = select_target(new URL(href, get_base_uri(document)));
    if (target) {
        if (!prefetching || href !== prefetching.href) {
            prefetching = { href, promise: hydrate_target(target) };
        }
        return prefetching.promise;
    }
}
function get_prefetched(target) {
    if (prefetching && prefetching.href === target.href) {
        return prefetching.promise;
    }
    else {
        return hydrate_target(target);
    }
}
function trigger_prefetch(event) {
    const a = find_anchor(event.target);
    if (a && a.rel === 'prefetch') {
        prefetch(a.href);
    }
}
function handle_mousemove(event) {
    clearTimeout(mousemove_timeout);
    mousemove_timeout = setTimeout(() => {
        trigger_prefetch(event);
    }, 20);
}

function goto(href, opts = { noscroll: false, replaceState: false }) {
    const target = select_target(new URL(href, get_base_uri(document)));
    if (target) {
        _history[opts.replaceState ? 'replaceState' : 'pushState']({ id: cid }, '', href);
        return navigate(target, null, opts.noscroll);
    }
    location.href = href;
    return new Promise(() => {
        /* never resolves */
    });
}

function page_store(value) {
    const store = writable(value);
    let ready = true;
    function notify() {
        ready = true;
        store.update(val => val);
    }
    function set(new_value) {
        ready = false;
        store.set(new_value);
    }
    function subscribe(run) {
        let old_value;
        return store.subscribe((new_value) => {
            if (old_value === undefined || (ready && new_value !== old_value)) {
                run(old_value = new_value);
            }
        });
    }
    return { notify, set, subscribe };
}

const initial_data = typeof __SAPPER__ !== 'undefined' && __SAPPER__;
let ready = false;
let root_component;
let current_token;
let root_preloaded;
let current_branch = [];
let current_query = '{}';
const stores = {
    page: page_store({}),
    preloading: writable(null),
    session: writable(initial_data && initial_data.session)
};
let $session;
let session_dirty;
stores.session.subscribe((value) => __awaiter(void 0, void 0, void 0, function* () {
    $session = value;
    if (!ready)
        return;
    session_dirty = true;
    const dest = select_target(new URL(location.href));
    const token = current_token = {};
    const { redirect, props, branch } = yield hydrate_target(dest);
    if (token !== current_token)
        return; // a secondary navigation happened while we were loading
    if (redirect) {
        yield goto(redirect.location, { replaceState: true });
    }
    else {
        yield render(branch, props, buildPageContext(props, dest.page));
    }
}));
let target;
function set_target(node) {
    target = node;
}
function start$1(opts) {
    set_target(opts.target);
    init$1(initial_data.baseUrl, handle_target$1);
    start();
    if (initial_data.error) {
        return Promise.resolve().then(() => {
            return handle_error();
        });
    }
    return load_current_page();
}
function handle_error() {
    const { host, pathname, search } = location;
    const { session, preloaded, status, error } = initial_data;
    if (!root_preloaded) {
        root_preloaded = preloaded && preloaded[0];
    }
    const props = {
        error,
        status,
        session,
        level0: {
            props: root_preloaded
        },
        level1: {
            props: {
                status,
                error
            },
            component: Error$1
        },
        segments: preloaded
    };
    const query = extract_query(search);
    render([], props, { host, path: pathname, query, params: {}, error });
}
function buildPageContext(props, page) {
    const { error } = props;
    return Object.assign({ error }, page);
}
function handle_target$1(dest) {
    return __awaiter(this, void 0, void 0, function* () {
        if (root_component)
            stores.preloading.set(true);
        const hydrating = get_prefetched(dest);
        const token = current_token = {};
        const hydrated_target = yield hydrating;
        const { redirect } = hydrated_target;
        if (token !== current_token)
            return; // a secondary navigation happened while we were loading
        if (redirect) {
            yield goto(redirect.location, { replaceState: true });
        }
        else {
            const { props, branch } = hydrated_target;
            yield render(branch, props, buildPageContext(props, dest.page));
        }
    });
}
function render(branch, props, page) {
    return __awaiter(this, void 0, void 0, function* () {
        stores.page.set(page);
        stores.preloading.set(false);
        if (root_component) {
            root_component.$set(props);
        }
        else {
            props.stores = {
                page: { subscribe: stores.page.subscribe },
                preloading: { subscribe: stores.preloading.subscribe },
                session: stores.session
            };
            props.level0 = {
                props: yield root_preloaded
            };
            props.notify = stores.page.notify;
            root_component = new App({
                target,
                props,
                hydrate: true
            });
        }
        current_branch = branch;
        current_query = JSON.stringify(page.query);
        ready = true;
        session_dirty = false;
    });
}
function part_changed(i, segment, match, stringified_query) {
    // TODO only check query string changes for preload functions
    // that do in fact depend on it (using static analysis or
    // runtime instrumentation)
    if (stringified_query !== current_query)
        return true;
    const previous = current_branch[i];
    if (!previous)
        return false;
    if (segment !== previous.segment)
        return true;
    if (previous.match) {
        if (JSON.stringify(previous.match.slice(1, i + 2)) !== JSON.stringify(match.slice(1, i + 2))) {
            return true;
        }
    }
}
function hydrate_target(dest) {
    return __awaiter(this, void 0, void 0, function* () {
        const { route, page } = dest;
        const segments = page.path.split('/').filter(Boolean);
        let redirect = null;
        const props = { error: null, status: 200, segments: [segments[0]] };
        const preload_context = {
            fetch: (url, opts) => fetch(url, opts),
            redirect: (statusCode, location) => {
                if (redirect && (redirect.statusCode !== statusCode || redirect.location !== location)) {
                    throw new Error('Conflicting redirects');
                }
                redirect = { statusCode, location };
            },
            error: (status, error) => {
                props.error = typeof error === 'string' ? new Error(error) : error;
                props.status = status;
            }
        };
        if (!root_preloaded) {
            const root_preload = undefined || (() => ({}));
            root_preloaded = initial_data.preloaded[0] || root_preload.call(preload_context, {
                host: page.host,
                path: page.path,
                query: page.query,
                params: {}
            }, $session);
        }
        let branch;
        let l = 1;
        try {
            const stringified_query = JSON.stringify(page.query);
            const match = route.pattern.exec(page.path);
            let segment_dirty = false;
            branch = yield Promise.all(route.parts.map((part, i) => __awaiter(this, void 0, void 0, function* () {
                const segment = segments[i];
                if (part_changed(i, segment, match, stringified_query))
                    segment_dirty = true;
                props.segments[l] = segments[i + 1]; // TODO make this less confusing
                if (!part)
                    return { segment };
                const j = l++;
                if (!session_dirty && !segment_dirty && current_branch[i] && current_branch[i].part === part.i) {
                    return current_branch[i];
                }
                segment_dirty = false;
                const { default: component, preload } = yield components[part.i].js();
                let preloaded;
                if (ready || !initial_data.preloaded[i + 1]) {
                    preloaded = preload
                        ? yield preload.call(preload_context, {
                            host: page.host,
                            path: page.path,
                            query: page.query,
                            params: part.params ? part.params(dest.match) : {}
                        }, $session)
                        : {};
                }
                else {
                    preloaded = initial_data.preloaded[i + 1];
                }
                return (props[`level${j}`] = { component, props: preloaded, segment, match, part: part.i });
            })));
        }
        catch (error) {
            props.error = error;
            props.status = 500;
            branch = [];
        }
        return { redirect, props, branch };
    });
}

var data = { footer:"2020 - Damien Simonin Feugas",
  intuitive:"Intuitive",
  "intuitive portable and open source":"It is intuitive, portable and open source!",
  install:"Install",
  "it stays tuned":"It stays tuned",
  "js powered":"Powered by JS",
  "for geeks":"For geeks",
  "Mélodie":"Mélodie",
  "Mélodie is a music player":"Mélodie is a music player",
  "no frills just the basics":"No frills, just the basics",
  organized:"Organized",
  "organized so you do not have to":"Organized, so you don't have to",
  "open source":"Open Source",
  "photo by _":"Photo by {name}",
  reactive:"Reactive",
  "works on your machine":"Works on your machine",
  description:{ basics:"<p>Plays Mp3, Ogg Vorbis and Flac files. Controls speak for themselves. </p> <p>What you don't see yet? Gap-less playback, ReplayGain, system notifications and media keys support.</p>\n",
    "open source":"<p>Mélodie's source code is <a class=\"underlined\" target=\"_blank\" href=\"https://github.com/feugy/melodie\">open <i class=\"material-icons\">launch</i></a>.</p> <p>This application is free to use, and free or any adds.</p>\n",
    organized:"<p>Mélodie reads tracks music metadata, and automatically creates your album and artist library.</p> <p>You don't need to change how you the actual files are organized on your hard drive.</p>\n",
    portable:"<p>May your favorite operating system be macOS, Windows or Linux, you will get the same user experience.</p>\n",
    technologies:"<p>With a lot of love and Electron, Svelte, RxJS, TailwindCSS, SQLite, Music-Metadata, Svelte SPA router...<p>\n",
    tuned:"<p>Thanks to <a class=\"underlined\" target=\"_blank\" href=\"https://www.theaudiodb.com\">AudioDB <i class=\"material-icons\">launch</i></a> and <a class=\"underlined\" target=\"_blank\" href=\"https://www.discogs.com/en\">Discogs <i class=\"material-icons\">launch</i></a>, Mélodie will enrich your libraries with covers, avatars and biographies (requires access keys).</p> <p>Add or remove files on your drive, change their metadata: your library will immediately update.</p> <p>A software update? It'll automatically apply next time you'll open it.</p>\n" },
  download:{ exe:"Setup",
    "portable exe":"Portable version",
    "portable zip":"Zip file",
    "app image":"App Image",
    "portable tar":"Tar.gz file",
    dmg:"Setup" } };

var data$1 = { "intuitive portable and open source":"Intuitif, portable et open source!",
  install:"Installer",
  "it stays tuned":"Elle est toujours à la page",
  "js powered":"Fait en JS",
  "for geeks":"Pour les Geeks",
  "Mélodie is a music player":"Mélodie est un lecteur de musique",
  "no frills just the basics":"Pas de fioritures, juste les fondamentaux",
  organized:"Organisée",
  "organized so you do not have to":"Organisée, pour que vous n'ayez pas à l'être",
  "photo by _":"Photo par {name}",
  "works on your machine":"Pour tous",
  description:{ basics:"<p>Lit les fichiers Mp3, Ogg Vorbis et Flac. Les contrôles parlent d'eux-mêmes. </p> <p>Ce que vous ne voyez pas encore ? Lecture en continue, ReplayGain, notifications système et support des touches de média.</p>\n",
    "open source":"<p>Le code source de Mélodie est <a class=\"underlined\" target=\"_blank\" href=\"https://github.com/feugy/melodie\">ouvert <i class=\"material-icons\">launch</i></a>.</p> <p>L'application est gratuite, et sans aucune publicités.</p>\n",
    organized:"<p>Mélodie lit les méta-données de vos morceaux, et crée automatiquement votre librairie d'albums et d'artistes.</p> <p>Vous n'avez pas besoin de changer la manières dont vos fichiers sont organisés sur le disque dur.</p>\n",
    portable:"<p>Que votre système d'exploitation préféré soit macOS, Windows ou Linux, profitez de la même expérience utilisateur.</p>\n",
    technologies:"<p>Avec beaucoup d'amour et Electron, Svelte, RxJS, TailwindCSS, SQLite, Music-Metadata, Svelte SPA router...<p>\n",
    tuned:"<p>Grâce à <a class=\"underlined\" target=\"_blank\" href=\"https://www.theaudiodb.com\">AudioDB <i class=\"material-icons\">launch</i></a> et <a class=\"underlined\" target=\"_blank\" href=\"https://www.discogs.com/en\">Discogs <i class=\"material-icons\">launch</i></a>, Mélodie enrichira votre librairie libraries avec des couvertures, avatars et biographies (nécessite des clés d'accès).</p> <p>Ajoutez ou supprimez des fichiers sur le disque, changez leurs méta-données : votre librairie le détectera immédiatement.</p> <p>Une nouvelle version ? Elle sera automatiquement installée lors du prochain redémarrage.</p>\n" },
  download:{ exe:"Installeur",
    "portable exe":"Version portable",
    "portable zip":"Fichier zip",
    "app image":"App Image",
    "portable tar":"Fichier tar.gz",
    dmg:"Installeur" } };

function defaultDeep(source, defaults) {
  const keys = Object.keys(defaults);
  for (const key of keys) {
    const defaultValue = defaults[key];
    if (!(key in source)) {
      source[key] = defaultValue;
    } else if (typeof defaultValue === 'object') {
      source[key] = defaultDeep(source[key], defaultValue);
    }
  }
  return source
}

const defaultKey = 'default';

/**
 * Configure several translations.
 * Each translation bundle is an object which keys are translation keys, and values translated strings.
 * You can configure several bundles at once.
 * One bundle can be set as default: its keys will be merged into other bundles.
 * Translation bundles are associated to a language code.
 * @param {Map<string, object>} added - a map of translations, keys being language code, values being translation bundle
 * @see https://github.com/Panya/svelte-intl#translations
 */
function addTranslations(added) {
  const defaultTranslation = added.get(defaultKey) || {};
  for (const [language, translation] of added) {
    if (language !== defaultKey) {
      translations.update({
        [language]: defaultDeep(translation, defaultTranslation)
      });
    }
  }
}

const bundles = new Map();
bundles.set(defaultKey, data);
bundles.set('en', data);
bundles.set('fr', data$1);

addTranslations(bundles);
locale.set(navigator.language.slice(0, 2));

start$1({
  target: document.querySelector('#sapper')
});

export { locale as $, prevent_default as A, compute_rest_props as B, assign as C, exclude_internal_props as D, bubble as E, create_component as F, claim_component as G, mount_component as H, get_spread_update as I, get_spread_object as J, destroy_component as K, run_all as L, createEventDispatcher as M, globals as N, group_outros as O, check_outros as P, add_render_callback as Q, create_bidirectional_transition as R, SvelteComponent as S, destroy_each as T, empty as U, noop as V, component_subscribe as W, set_style as X, set_attributes as Y, query_selector_all as Z, _, attr as a, goto as a0, HtmlTag as a1, insert as b, claim_element as c, detach as d, element as e, create_slot as f, space as g, children as h, init as i, claim_space as j, claim_text as k, append as l, set_data as m, transition_in as n, transition_out as o, onMount as p, binding_callbacks as q, action_destroyer as r, safe_not_equal as s, text as t, update_slot as u, is_function as v, null_to_empty as w, toggle_class as x, listen as y, stop_propagation as z };

import __inject_styles from './inject_styles.5607aec6.js';