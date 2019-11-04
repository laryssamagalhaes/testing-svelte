
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
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
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
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
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
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
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
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
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
                return ret;
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
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
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/components/Input.svelte generated by Svelte v3.12.1 */

    const file = "src/components/Input.svelte";

    function create_fragment(ctx) {
    	var div, label_1, t0, t1, input, input_placeholder_value, dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			label_1 = element("label");
    			t0 = text(ctx.label);
    			t1 = space();
    			input = element("input");
    			attr_dev(label_1, "class", "svelte-1j0oic1");
    			add_location(label_1, file, 21, 2, 237);
    			attr_dev(input, "name", ctx.name);
    			attr_dev(input, "placeholder", input_placeholder_value = `Write your ${ctx.placeholder} here`);
    			attr_dev(input, "class", "svelte-1j0oic1");
    			add_location(input, file, 22, 2, 262);
    			add_location(div, file, 20, 0, 229);

    			dispose = [
    				listen_dev(input, "input", ctx.input_input_handler),
    				listen_dev(input, "change", ctx.change_handler)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label_1);
    			append_dev(label_1, t0);
    			append_dev(div, t1);
    			append_dev(div, input);

    			set_input_value(input, ctx.value);
    		},

    		p: function update(changed, ctx) {
    			if (changed.label) {
    				set_data_dev(t0, ctx.label);
    			}

    			if (changed.value && (input.value !== ctx.value)) set_input_value(input, ctx.value);

    			if (changed.name) {
    				attr_dev(input, "name", ctx.name);
    			}

    			if ((changed.placeholder) && input_placeholder_value !== (input_placeholder_value = `Write your ${ctx.placeholder} here`)) {
    				attr_dev(input, "placeholder", input_placeholder_value);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { name, label, placeholder, value, onChange } = $$props;

    	const writable_props = ['name', 'label', 'placeholder', 'value', 'onChange'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Input> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate('value', value);
    	}

    	const change_handler = () => onChange(value);

    	$$self.$set = $$props => {
    		if ('name' in $$props) $$invalidate('name', name = $$props.name);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    		if ('onChange' in $$props) $$invalidate('onChange', onChange = $$props.onChange);
    	};

    	$$self.$capture_state = () => {
    		return { name, label, placeholder, value, onChange };
    	};

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate('name', name = $$props.name);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    		if ('onChange' in $$props) $$invalidate('onChange', onChange = $$props.onChange);
    	};

    	return {
    		name,
    		label,
    		placeholder,
    		value,
    		onChange,
    		input_input_handler,
    		change_handler
    	};
    }

    class Input extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["name", "label", "placeholder", "value", "onChange"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Input", options, id: create_fragment.name });

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.name === undefined && !('name' in props)) {
    			console.warn("<Input> was created without expected prop 'name'");
    		}
    		if (ctx.label === undefined && !('label' in props)) {
    			console.warn("<Input> was created without expected prop 'label'");
    		}
    		if (ctx.placeholder === undefined && !('placeholder' in props)) {
    			console.warn("<Input> was created without expected prop 'placeholder'");
    		}
    		if (ctx.value === undefined && !('value' in props)) {
    			console.warn("<Input> was created without expected prop 'value'");
    		}
    		if (ctx.onChange === undefined && !('onChange' in props)) {
    			console.warn("<Input> was created without expected prop 'onChange'");
    		}
    	}

    	get name() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onChange() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onChange(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Button.svelte generated by Svelte v3.12.1 */

    const file$1 = "src/components/Button.svelte";

    function create_fragment$1(ctx) {
    	var button, t, dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(ctx.content);
    			attr_dev(button, "class", "svelte-j01d3d");
    			add_location(button, file$1, 18, 0, 246);
    			dispose = listen_dev(button, "click", ctx.onClick);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.content) {
    				set_data_dev(t, ctx.content);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(button);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$1.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { content, onClick } = $$props;

    	const writable_props = ['content', 'onClick'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('content' in $$props) $$invalidate('content', content = $$props.content);
    		if ('onClick' in $$props) $$invalidate('onClick', onClick = $$props.onClick);
    	};

    	$$self.$capture_state = () => {
    		return { content, onClick };
    	};

    	$$self.$inject_state = $$props => {
    		if ('content' in $$props) $$invalidate('content', content = $$props.content);
    		if ('onClick' in $$props) $$invalidate('onClick', onClick = $$props.onClick);
    	};

    	return { content, onClick };
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["content", "onClick"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Button", options, id: create_fragment$1.name });

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.content === undefined && !('content' in props)) {
    			console.warn("<Button> was created without expected prop 'content'");
    		}
    		if (ctx.onClick === undefined && !('onClick' in props)) {
    			console.warn("<Button> was created without expected prop 'onClick'");
    		}
    	}

    	get content() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set content(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onClick() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onClick(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.12.1 */

    const file$2 = "src/App.svelte";

    function create_fragment$2(ctx) {
    	var div, t0, t1, t2, current;

    	var input0_spread_levels = [
    		ctx.firstNameProps,
    		{ onChange: ctx.getValueInput(ctx.firstNameProps) }
    	];

    	let input0_props = {};
    	for (var i = 0; i < input0_spread_levels.length; i += 1) {
    		input0_props = assign(input0_props, input0_spread_levels[i]);
    	}
    	var input0 = new Input({ props: input0_props, $$inline: true });

    	var input1_spread_levels = [
    		ctx.lasttNameProps,
    		{ onChange: ctx.getValueInput(ctx.lasttNameProps) }
    	];

    	let input1_props = {};
    	for (var i = 0; i < input1_spread_levels.length; i += 1) {
    		input1_props = assign(input1_props, input1_spread_levels[i]);
    	}
    	var input1 = new Input({ props: input1_props, $$inline: true });

    	var input2_spread_levels = [
    		ctx.ageProps,
    		{ onChange: ctx.getValueInput(ctx.ageProps) }
    	];

    	let input2_props = {};
    	for (var i = 0; i < input2_spread_levels.length; i += 1) {
    		input2_props = assign(input2_props, input2_spread_levels[i]);
    	}
    	var input2 = new Input({ props: input2_props, $$inline: true });

    	var button_spread_levels = [
    		ctx.buttonProps
    	];

    	let button_props = {};
    	for (var i = 0; i < button_spread_levels.length; i += 1) {
    		button_props = assign(button_props, button_spread_levels[i]);
    	}
    	var button = new Button({ props: button_props, $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			input0.$$.fragment.c();
    			t0 = space();
    			input1.$$.fragment.c();
    			t1 = space();
    			input2.$$.fragment.c();
    			t2 = space();
    			button.$$.fragment.c();
    			attr_dev(div, "class", "container svelte-fzmfgd");
    			add_location(div, file$2, 51, 0, 934);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(input0, div, null);
    			append_dev(div, t0);
    			mount_component(input1, div, null);
    			append_dev(div, t1);
    			mount_component(input2, div, null);
    			append_dev(div, t2);
    			mount_component(button, div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var input0_changes = (changed.firstNameProps || changed.getValueInput) ? get_spread_update(input0_spread_levels, [
    									(changed.firstNameProps) && get_spread_object(ctx.firstNameProps),
    			input0_spread_levels[1]
    								]) : {};
    			input0.$set(input0_changes);

    			var input1_changes = (changed.lasttNameProps || changed.getValueInput) ? get_spread_update(input1_spread_levels, [
    									(changed.lasttNameProps) && get_spread_object(ctx.lasttNameProps),
    			input1_spread_levels[1]
    								]) : {};
    			input1.$set(input1_changes);

    			var input2_changes = (changed.ageProps || changed.getValueInput) ? get_spread_update(input2_spread_levels, [
    									(changed.ageProps) && get_spread_object(ctx.ageProps),
    			input2_spread_levels[1]
    								]) : {};
    			input2.$set(input2_changes);

    			var button_changes = (changed.buttonProps) ? get_spread_update(button_spread_levels, [
    									get_spread_object(ctx.buttonProps)
    								]) : {};
    			button.$set(button_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(input0.$$.fragment, local);

    			transition_in(input1.$$.fragment, local);

    			transition_in(input2.$$.fragment, local);

    			transition_in(button.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(input0.$$.fragment, local);
    			transition_out(input1.$$.fragment, local);
    			transition_out(input2.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			destroy_component(input0);

    			destroy_component(input1);

    			destroy_component(input2);

    			destroy_component(button);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$2.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$2($$self) {
    	

      let firstNameProps = {
        placeholder: 'first name',
        name: 'firstName',
        label: 'First name:',
        value: ''
      };

      let lasttNameProps = {
        placeholder: 'last name',
        name: 'lastName',
        label: 'Last name:',
        value: ''
      };

      let ageProps = {
        placeholder: 'age',
        name: 'age',
        label: 'Age:',
        value: ''
      };

      const buttonProps = {
        content: "Send data",
        onClick: () => {
          alert(`
        Name: ${firstNameProps.value}
        Last name: ${lasttNameProps.value} 
        Age: ${ageProps.value}
      `);
        }
      };

      const getValueInput = (variableToUpate) => (value) => {
       variableToUpate.value = value;
      };

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('firstNameProps' in $$props) $$invalidate('firstNameProps', firstNameProps = $$props.firstNameProps);
    		if ('lasttNameProps' in $$props) $$invalidate('lasttNameProps', lasttNameProps = $$props.lasttNameProps);
    		if ('ageProps' in $$props) $$invalidate('ageProps', ageProps = $$props.ageProps);
    	};

    	return {
    		firstNameProps,
    		lasttNameProps,
    		ageProps,
    		buttonProps,
    		getValueInput
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "App", options, id: create_fragment$2.name });
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
