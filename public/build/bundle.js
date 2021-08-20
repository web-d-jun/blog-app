
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
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
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
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
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
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
    const outroing = new Set();
    let outros;
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
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
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
        }
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
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
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
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
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
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
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

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.42.1' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/AppHeader.svelte generated by Svelte v3.42.1 */

    const file$2 = "src/components/AppHeader.svelte";

    function create_fragment$2(ctx) {
    	let header;
    	let nav;
    	let div1;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let img1;
    	let img1_src_value;
    	let t1;
    	let div0;
    	let t3;
    	let div2;
    	let button;
    	let t5;
    	let ul;
    	let li0;
    	let t7;
    	let li1;
    	let t9;
    	let li2;
    	let t11;
    	let li3;
    	let t13;
    	let li4;
    	let t15;
    	let li5;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			header = element("header");
    			nav = element("nav");
    			div1 = element("div");
    			img0 = element("img");
    			t0 = text("&");
    			img1 = element("img");
    			t1 = space();
    			div0 = element("div");
    			div0.textContent = "BAEHA & Svelte";
    			t3 = space();
    			div2 = element("div");
    			button = element("button");
    			button.textContent = "글쓰기";
    			t5 = space();
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "Tutorial";
    			t7 = space();
    			li1 = element("li");
    			li1.textContent = "Doc";
    			t9 = space();
    			li2 = element("li");
    			li2.textContent = "Examples";
    			t11 = space();
    			li3 = element("li");
    			li3.textContent = "REPL";
    			t13 = space();
    			li4 = element("li");
    			li4.textContent = "FAQ";
    			t15 = space();
    			li5 = element("li");
    			li5.textContent = "SvelteKit";
    			if (!src_url_equal(img0.src, img0_src_value = imageLogo)) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "logo");
    			attr_dev(img0, "class", "logo svelte-1uxqny0");
    			add_location(img0, file$2, 26, 6, 789);
    			if (!src_url_equal(img1.src, img1_src_value = imageSvelteLogo)) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "logo");
    			attr_dev(img1, "class", "logo svelte-1uxqny0");
    			add_location(img1, file$2, 26, 54, 837);
    			attr_dev(div0, "class", "logo-name svelte-1uxqny0");
    			add_location(div0, file$2, 27, 6, 898);
    			attr_dev(div1, "class", "logo__container svelte-1uxqny0");
    			add_location(div1, file$2, 25, 4, 752);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "write-button svelte-1uxqny0");
    			add_location(button, file$2, 30, 6, 990);
    			attr_dev(li0, "class", "svelte-1uxqny0");
    			add_location(li0, file$2, 32, 8, 1078);
    			attr_dev(li1, "class", "svelte-1uxqny0");
    			add_location(li1, file$2, 33, 8, 1151);
    			attr_dev(li2, "class", "svelte-1uxqny0");
    			add_location(li2, file$2, 34, 8, 1214);
    			attr_dev(li3, "class", "svelte-1uxqny0");
    			add_location(li3, file$2, 35, 8, 1287);
    			attr_dev(li4, "class", "svelte-1uxqny0");
    			add_location(li4, file$2, 36, 8, 1352);
    			attr_dev(li5, "class", "svelte-1uxqny0");
    			add_location(li5, file$2, 37, 8, 1415);
    			attr_dev(ul, "class", "ul svelte-1uxqny0");
    			add_location(ul, file$2, 31, 6, 1053);
    			attr_dev(div2, "class", "nav__wrap svelte-1uxqny0");
    			add_location(div2, file$2, 29, 4, 959);
    			attr_dev(nav, "class", "svelte-1uxqny0");
    			add_location(nav, file$2, 24, 2, 741);
    			attr_dev(header, "class", "svelte-1uxqny0");
    			add_location(header, file$2, 23, 0, 729);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, nav);
    			append_dev(nav, div1);
    			append_dev(div1, img0);
    			append_dev(div1, t0);
    			append_dev(div1, img1);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(nav, t3);
    			append_dev(nav, div2);
    			append_dev(div2, button);
    			append_dev(div2, t5);
    			append_dev(div2, ul);
    			append_dev(ul, li0);
    			append_dev(ul, t7);
    			append_dev(ul, li1);
    			append_dev(ul, t9);
    			append_dev(ul, li2);
    			append_dev(ul, t11);
    			append_dev(ul, li3);
    			append_dev(ul, t13);
    			append_dev(ul, li4);
    			append_dev(ul, t15);
    			append_dev(ul, li5);

    			if (!mounted) {
    				dispose = [
    					listen_dev(li0, "click", /*click_handler*/ ctx[1], false, false, false),
    					listen_dev(li1, "click", /*click_handler_1*/ ctx[2], false, false, false),
    					listen_dev(li2, "click", /*click_handler_2*/ ctx[3], false, false, false),
    					listen_dev(li3, "click", /*click_handler_3*/ ctx[4], false, false, false),
    					listen_dev(li4, "click", /*click_handler_4*/ ctx[5], false, false, false),
    					listen_dev(li5, "click", /*click_handler_5*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const imageLogo = "assets/images/logo_iam.png";
    const imageSvelteLogo = "assets/images/svelte.png";

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AppHeader', slots, []);

    	const handleNavigation = navigation => {
    		let url = "";

    		if (navigation === "Tutorial") {
    			url = "https://svelte.dev/tutorial";
    		} else if (navigation === "Doc") {
    			url = "https://svelte.dev/docs";
    		} else if (navigation === "Examples") {
    			url = "https://svelte.dev/examples";
    		} else if (navigation === "REPL") {
    			url = "https://svelte.dev/repl";
    		} else if (navigation === "FAQ") {
    			url = "https://svelte.dev/faq";
    		} else if (navigation === "SvelteKit") {
    			url = "https://kit.svelte.dev/";
    		}

    		window.open(url);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AppHeader> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => handleNavigation("Tutorial");
    	const click_handler_1 = () => handleNavigation("Doc");
    	const click_handler_2 = () => handleNavigation("Examples");
    	const click_handler_3 = () => handleNavigation("REPL");
    	const click_handler_4 = () => handleNavigation("FAQ");
    	const click_handler_5 = () => handleNavigation("SvelteKit");

    	$$self.$capture_state = () => ({
    		imageLogo,
    		imageSvelteLogo,
    		handleNavigation
    	});

    	return [
    		handleNavigation,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5
    	];
    }

    class AppHeader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppHeader",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/AppBody.svelte generated by Svelte v3.42.1 */

    const file$1 = "src/components/AppBody.svelte";

    function create_fragment$1(ctx) {
    	let main;

    	const block = {
    		c: function create() {
    			main = element("main");
    			main.textContent = "무엇이 들어갈까...";
    			add_location(main, file$1, 3, 0, 23);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AppBody', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AppBody> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class AppBody extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppBody",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.42.1 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let div;
    	let header;
    	let t;
    	let body;
    	let current;
    	header = new AppHeader({ $$inline: true });
    	body = new AppBody({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(header.$$.fragment);
    			t = space();
    			create_component(body.$$.fragment);
    			attr_dev(div, "class", "container");
    			add_location(div, file, 5, 0, 129);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(header, div, null);
    			append_dev(div, t);
    			mount_component(body, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(body.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(body.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(header);
    			destroy_component(body);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Header: AppHeader, Body: AppBody });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
