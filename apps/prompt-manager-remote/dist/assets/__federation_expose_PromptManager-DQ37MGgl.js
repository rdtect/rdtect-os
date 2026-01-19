import { D as current_batch, E as resume_effect, F as destroy_effect, G as pause_effect, H as create_text, I as branch, h as hydrating, f as hydrate_node, J as move_effect, K as should_defer_append, L as block, b as hydrate_next, M as EFFECT_TRANSPARENT, N as read_hydration_instruction, O as HYDRATION_START_ELSE, P as skip_nodes, Q as set_hydrate_node, R as set_hydrating, g as get_first_child, S as get, T as derived_safe_equal, U as COMMENT_NODE, V as HYDRATION_END, W as internal_set, X as source, Y as mutable_source, Z as EACH_INDEX_REACTIVE, _ as EACH_ITEM_REACTIVE, $ as EACH_ITEM_IMMUTABLE, a0 as array_from, n as is_array, a1 as EFFECT_OFFSCREEN, a2 as INERT, a3 as get_next_sibling, a4 as clear_text_content, a5 as queue_micro_task, a6 as EACH_IS_CONTROLLED, a7 as EACH_IS_ANIMATED, a8 as listen_to_event_and_reset_event, a9 as effect, t as teardown, aa as select_multiple_invalid_value, ab as is, ac as previous_batch, ad as add_form_reset_listener, ae as LOADING_ATTR_SYMBOL, af as NAMESPACE_HTML, ag as get_prototype_of, ah as get_descriptors, B as tick, m as untrack, ai as render_effect, aj as delegate, ak as state, al as proxy, u as user_effect, am as from_html, an as child, ao as sibling, ap as append, aq as pop, ar as set, as as push, at as user_derived, au as reset, av as first_child, aw as next, ax as template_effect, ay as set_text, az as comment, aA as remove_textarea_child } from './render-BHq2ri7V.js';

// generated during release, do not modify

const PUBLIC_VERSION = '5';

if (typeof window !== 'undefined') {
	// @ts-expect-error
	((window.__svelte ??= {}).v ??= new Set()).add(PUBLIC_VERSION);
}

/** @import { Effect, TemplateNode } from '#client' */

/**
 * @typedef {{ effect: Effect, fragment: DocumentFragment }} Branch
 */

/**
 * @template Key
 */
class BranchManager {
	/** @type {TemplateNode} */
	anchor;

	/** @type {Map<Batch, Key>} */
	#batches = new Map();

	/**
	 * Map of keys to effects that are currently rendered in the DOM.
	 * These effects are visible and actively part of the document tree.
	 * Example:
	 * ```
	 * {#if condition}
	 * 	foo
	 * {:else}
	 * 	bar
	 * {/if}
	 * ```
	 * Can result in the entries `true->Effect` and `false->Effect`
	 * @type {Map<Key, Effect>}
	 */
	#onscreen = new Map();

	/**
	 * Similar to #onscreen with respect to the keys, but contains branches that are not yet
	 * in the DOM, because their insertion is deferred.
	 * @type {Map<Key, Branch>}
	 */
	#offscreen = new Map();

	/**
	 * Keys of effects that are currently outroing
	 * @type {Set<Key>}
	 */
	#outroing = new Set();

	/**
	 * Whether to pause (i.e. outro) on change, or destroy immediately.
	 * This is necessary for `<svelte:element>`
	 */
	#transition = true;

	/**
	 * @param {TemplateNode} anchor
	 * @param {boolean} transition
	 */
	constructor(anchor, transition = true) {
		this.anchor = anchor;
		this.#transition = transition;
	}

	#commit = () => {
		var batch = /** @type {Batch} */ (current_batch);

		// if this batch was made obsolete, bail
		if (!this.#batches.has(batch)) return;

		var key = /** @type {Key} */ (this.#batches.get(batch));

		var onscreen = this.#onscreen.get(key);

		if (onscreen) {
			// effect is already in the DOM — abort any current outro
			resume_effect(onscreen);
			this.#outroing.delete(key);
		} else {
			// effect is currently offscreen. put it in the DOM
			var offscreen = this.#offscreen.get(key);

			if (offscreen) {
				this.#onscreen.set(key, offscreen.effect);
				this.#offscreen.delete(key);

				// remove the anchor...
				/** @type {TemplateNode} */ (offscreen.fragment.lastChild).remove();

				// ...and append the fragment
				this.anchor.before(offscreen.fragment);
				onscreen = offscreen.effect;
			}
		}

		for (const [b, k] of this.#batches) {
			this.#batches.delete(b);

			if (b === batch) {
				// keep values for newer batches
				break;
			}

			const offscreen = this.#offscreen.get(k);

			if (offscreen) {
				// for older batches, destroy offscreen effects
				// as they will never be committed
				destroy_effect(offscreen.effect);
				this.#offscreen.delete(k);
			}
		}

		// outro/destroy all onscreen effects...
		for (const [k, effect] of this.#onscreen) {
			// ...except the one that was just committed
			//    or those that are already outroing (else the transition is aborted and the effect destroyed right away)
			if (k === key || this.#outroing.has(k)) continue;

			const on_destroy = () => {
				const keys = Array.from(this.#batches.values());

				if (keys.includes(k)) {
					// keep the effect offscreen, as another batch will need it
					var fragment = document.createDocumentFragment();
					move_effect(effect, fragment);

					fragment.append(create_text()); // TODO can we avoid this?

					this.#offscreen.set(k, { effect, fragment });
				} else {
					destroy_effect(effect);
				}

				this.#outroing.delete(k);
				this.#onscreen.delete(k);
			};

			if (this.#transition || !onscreen) {
				this.#outroing.add(k);
				pause_effect(effect, on_destroy, false);
			} else {
				on_destroy();
			}
		}
	};

	/**
	 * @param {Batch} batch
	 */
	#discard = (batch) => {
		this.#batches.delete(batch);

		const keys = Array.from(this.#batches.values());

		for (const [k, branch] of this.#offscreen) {
			if (!keys.includes(k)) {
				destroy_effect(branch.effect);
				this.#offscreen.delete(k);
			}
		}
	};

	/**
	 *
	 * @param {any} key
	 * @param {null | ((target: TemplateNode) => void)} fn
	 */
	ensure(key, fn) {
		var batch = /** @type {Batch} */ (current_batch);
		var defer = should_defer_append();

		if (fn && !this.#onscreen.has(key) && !this.#offscreen.has(key)) {
			if (defer) {
				var fragment = document.createDocumentFragment();
				var target = create_text();

				fragment.append(target);

				this.#offscreen.set(key, {
					effect: branch(() => fn(target)),
					fragment
				});
			} else {
				this.#onscreen.set(
					key,
					branch(() => fn(this.anchor))
				);
			}
		}

		this.#batches.set(batch, key);

		if (defer) {
			for (const [k, effect] of this.#onscreen) {
				if (k === key) {
					batch.skipped_effects.delete(effect);
				} else {
					batch.skipped_effects.add(effect);
				}
			}

			for (const [k, branch] of this.#offscreen) {
				if (k === key) {
					batch.skipped_effects.delete(branch.effect);
				} else {
					batch.skipped_effects.add(branch.effect);
				}
			}

			batch.oncommit(this.#commit);
			batch.ondiscard(this.#discard);
		} else {
			if (hydrating) {
				this.anchor = hydrate_node;
			}

			this.#commit();
		}
	}
}

/** @import { TemplateNode } from '#client' */

// TODO reinstate https://github.com/sveltejs/svelte/pull/15250

/**
 * @param {TemplateNode} node
 * @param {(branch: (fn: (anchor: Node) => void, flag?: boolean) => void) => void} fn
 * @param {boolean} [elseif] True if this is an `{:else if ...}` block rather than an `{#if ...}`, as that affects which transitions are considered 'local'
 * @returns {void}
 */
function if_block(node, fn, elseif = false) {
	if (hydrating) {
		hydrate_next();
	}

	var branches = new BranchManager(node);
	var flags = elseif ? EFFECT_TRANSPARENT : 0;

	/**
	 * @param {boolean} condition,
	 * @param {null | ((anchor: Node) => void)} fn
	 */
	function update_branch(condition, fn) {
		if (hydrating) {
			const is_else = read_hydration_instruction(node) === HYDRATION_START_ELSE;

			if (condition === is_else) {
				// Hydration mismatch: remove everything inside the anchor and start fresh.
				// This could happen with `{#if browser}...{/if}`, for example
				var anchor = skip_nodes();

				set_hydrate_node(anchor);
				branches.anchor = anchor;

				set_hydrating(false);
				branches.ensure(condition, fn);
				set_hydrating(true);

				return;
			}
		}

		branches.ensure(condition, fn);
	}

	block(() => {
		var has_branch = false;

		fn((fn, flag = true) => {
			has_branch = true;
			update_branch(flag, fn);
		});

		if (!has_branch) {
			update_branch(false, null);
		}
	}, flags);
}

/** @import { EachItem, EachOutroGroup, EachState, Effect, EffectNodes, MaybeSource, Source, TemplateNode, TransitionManager, Value } from '#client' */
/** @import { Batch } from '../../reactivity/batch.js'; */

// When making substantive changes to this file, validate them with the each block stress test:
// https://svelte.dev/playground/1972b2cf46564476ad8c8c6405b23b7b
// This test also exists in this repo, as `packages/svelte/tests/manual/each-stress-test`

/**
 * @param {any} _
 * @param {number} i
 */
function index(_, i) {
	return i;
}

/**
 * Pause multiple effects simultaneously, and coordinate their
 * subsequent destruction. Used in each blocks
 * @param {EachState} state
 * @param {Effect[]} to_destroy
 * @param {null | Node} controlled_anchor
 */
function pause_effects(state, to_destroy, controlled_anchor) {
	/** @type {TransitionManager[]} */
	var transitions = [];
	var length = to_destroy.length;

	/** @type {EachOutroGroup} */
	var group;
	var remaining = to_destroy.length;

	for (var i = 0; i < length; i++) {
		let effect = to_destroy[i];

		pause_effect(
			effect,
			() => {
				if (group) {
					group.pending.delete(effect);
					group.done.add(effect);

					if (group.pending.size === 0) {
						var groups = /** @type {Set<EachOutroGroup>} */ (state.outrogroups);

						destroy_effects(array_from(group.done));
						groups.delete(group);

						if (groups.size === 0) {
							state.outrogroups = null;
						}
					}
				} else {
					remaining -= 1;
				}
			},
			false
		);
	}

	if (remaining === 0) {
		// If we're in a controlled each block (i.e. the block is the only child of an
		// element), and we are removing all items, _and_ there are no out transitions,
		// we can use the fast path — emptying the element and replacing the anchor
		var fast_path = transitions.length === 0 && controlled_anchor !== null;

		if (fast_path) {
			var anchor = /** @type {Element} */ (controlled_anchor);
			var parent_node = /** @type {Element} */ (anchor.parentNode);

			clear_text_content(parent_node);
			parent_node.append(anchor);

			state.items.clear();
		}

		destroy_effects(to_destroy, !fast_path);
	} else {
		group = {
			pending: new Set(to_destroy),
			done: new Set()
		};

		(state.outrogroups ??= new Set()).add(group);
	}
}

/**
 * @param {Effect[]} to_destroy
 * @param {boolean} remove_dom
 */
function destroy_effects(to_destroy, remove_dom = true) {
	// TODO only destroy effects if no pending batch needs them. otherwise,
	// just re-add the `EFFECT_OFFSCREEN` flag
	for (var i = 0; i < to_destroy.length; i++) {
		destroy_effect(to_destroy[i], remove_dom);
	}
}

/** @type {TemplateNode} */
var offscreen_anchor;

/**
 * @template V
 * @param {Element | Comment} node The next sibling node, or the parent node if this is a 'controlled' block
 * @param {number} flags
 * @param {() => V[]} get_collection
 * @param {(value: V, index: number) => any} get_key
 * @param {(anchor: Node, item: MaybeSource<V>, index: MaybeSource<number>) => void} render_fn
 * @param {null | ((anchor: Node) => void)} fallback_fn
 * @returns {void}
 */
function each(node, flags, get_collection, get_key, render_fn, fallback_fn = null) {
	var anchor = node;

	/** @type {Map<any, EachItem>} */
	var items = new Map();

	var is_controlled = (flags & EACH_IS_CONTROLLED) !== 0;

	if (is_controlled) {
		var parent_node = /** @type {Element} */ (node);

		anchor = hydrating
			? set_hydrate_node(get_first_child(parent_node))
			: parent_node.appendChild(create_text());
	}

	if (hydrating) {
		hydrate_next();
	}

	/** @type {Effect | null} */
	var fallback = null;

	// TODO: ideally we could use derived for runes mode but because of the ability
	// to use a store which can be mutated, we can't do that here as mutating a store
	// will still result in the collection array being the same from the store
	var each_array = derived_safe_equal(() => {
		var collection = get_collection();

		return is_array(collection) ? collection : collection == null ? [] : array_from(collection);
	});

	/** @type {V[]} */
	var array;

	var first_run = true;

	function commit() {
		state.fallback = fallback;
		reconcile(state, array, anchor, flags, get_key);

		if (fallback !== null) {
			if (array.length === 0) {
				if ((fallback.f & EFFECT_OFFSCREEN) === 0) {
					resume_effect(fallback);
				} else {
					fallback.f ^= EFFECT_OFFSCREEN;
					move(fallback, null, anchor);
				}
			} else {
				pause_effect(fallback, () => {
					// TODO only null out if no pending batch needs it,
					// otherwise re-add `fallback.fragment` and move the
					// effect into it
					fallback = null;
				});
			}
		}
	}

	var effect = block(() => {
		array = /** @type {V[]} */ (get(each_array));
		var length = array.length;

		/** `true` if there was a hydration mismatch. Needs to be a `let` or else it isn't treeshaken out */
		let mismatch = false;

		if (hydrating) {
			var is_else = read_hydration_instruction(anchor) === HYDRATION_START_ELSE;

			if (is_else !== (length === 0)) {
				// hydration mismatch — remove the server-rendered DOM and start over
				anchor = skip_nodes();

				set_hydrate_node(anchor);
				set_hydrating(false);
				mismatch = true;
			}
		}

		var keys = new Set();
		var batch = /** @type {Batch} */ (current_batch);
		var defer = should_defer_append();

		for (var index = 0; index < length; index += 1) {
			if (
				hydrating &&
				hydrate_node.nodeType === COMMENT_NODE &&
				/** @type {Comment} */ (hydrate_node).data === HYDRATION_END
			) {
				// The server rendered fewer items than expected,
				// so break out and continue appending non-hydrated items
				anchor = /** @type {Comment} */ (hydrate_node);
				mismatch = true;
				set_hydrating(false);
			}

			var value = array[index];
			var key = get_key(value, index);

			var item = first_run ? null : items.get(key);

			if (item) {
				// update before reconciliation, to trigger any async updates
				if (item.v) internal_set(item.v, value);
				if (item.i) internal_set(item.i, index);

				if (defer) {
					batch.skipped_effects.delete(item.e);
				}
			} else {
				item = create_item(
					items,
					first_run ? anchor : (offscreen_anchor ??= create_text()),
					value,
					key,
					index,
					render_fn,
					flags,
					get_collection
				);

				if (!first_run) {
					item.e.f |= EFFECT_OFFSCREEN;
				}

				items.set(key, item);
			}

			keys.add(key);
		}

		if (length === 0 && fallback_fn && !fallback) {
			if (first_run) {
				fallback = branch(() => fallback_fn(anchor));
			} else {
				fallback = branch(() => fallback_fn((offscreen_anchor ??= create_text())));
				fallback.f |= EFFECT_OFFSCREEN;
			}
		}

		// remove excess nodes
		if (hydrating && length > 0) {
			set_hydrate_node(skip_nodes());
		}

		if (!first_run) {
			if (defer) {
				for (const [key, item] of items) {
					if (!keys.has(key)) {
						batch.skipped_effects.add(item.e);
					}
				}

				batch.oncommit(commit);
				batch.ondiscard(() => {
					// TODO presumably we need to do something here?
				});
			} else {
				commit();
			}
		}

		if (mismatch) {
			// continue in hydration mode
			set_hydrating(true);
		}

		// When we mount the each block for the first time, the collection won't be
		// connected to this effect as the effect hasn't finished running yet and its deps
		// won't be assigned. However, it's possible that when reconciling the each block
		// that a mutation occurred and it's made the collection MAYBE_DIRTY, so reading the
		// collection again can provide consistency to the reactive graph again as the deriveds
		// will now be `CLEAN`.
		get(each_array);
	});

	/** @type {EachState} */
	var state = { effect, items, outrogroups: null, fallback };

	first_run = false;

	if (hydrating) {
		anchor = hydrate_node;
	}
}

/**
 * Add, remove, or reorder items output by an each block as its input changes
 * @template V
 * @param {EachState} state
 * @param {Array<V>} array
 * @param {Element | Comment | Text} anchor
 * @param {number} flags
 * @param {(value: V, index: number) => any} get_key
 * @returns {void}
 */
function reconcile(state, array, anchor, flags, get_key) {
	var is_animated = (flags & EACH_IS_ANIMATED) !== 0;

	var length = array.length;
	var items = state.items;
	var current = state.effect.first;

	/** @type {undefined | Set<Effect>} */
	var seen;

	/** @type {Effect | null} */
	var prev = null;

	/** @type {undefined | Set<Effect>} */
	var to_animate;

	/** @type {Effect[]} */
	var matched = [];

	/** @type {Effect[]} */
	var stashed = [];

	/** @type {V} */
	var value;

	/** @type {any} */
	var key;

	/** @type {Effect | undefined} */
	var effect;

	/** @type {number} */
	var i;

	if (is_animated) {
		for (i = 0; i < length; i += 1) {
			value = array[i];
			key = get_key(value, i);
			effect = /** @type {EachItem} */ (items.get(key)).e;

			// offscreen == coming in now, no animation in that case,
			// else this would happen https://github.com/sveltejs/svelte/issues/17181
			if ((effect.f & EFFECT_OFFSCREEN) === 0) {
				effect.nodes?.a?.measure();
				(to_animate ??= new Set()).add(effect);
			}
		}
	}

	for (i = 0; i < length; i += 1) {
		value = array[i];
		key = get_key(value, i);

		effect = /** @type {EachItem} */ (items.get(key)).e;

		if (state.outrogroups !== null) {
			for (const group of state.outrogroups) {
				group.pending.delete(effect);
				group.done.delete(effect);
			}
		}

		if ((effect.f & EFFECT_OFFSCREEN) !== 0) {
			effect.f ^= EFFECT_OFFSCREEN;

			if (effect === current) {
				move(effect, null, anchor);
			} else {
				var next = prev ? prev.next : current;

				if (effect === state.effect.last) {
					state.effect.last = effect.prev;
				}

				if (effect.prev) effect.prev.next = effect.next;
				if (effect.next) effect.next.prev = effect.prev;
				link(state, prev, effect);
				link(state, effect, next);

				move(effect, next, anchor);
				prev = effect;

				matched = [];
				stashed = [];

				current = prev.next;
				continue;
			}
		}

		if ((effect.f & INERT) !== 0) {
			resume_effect(effect);
			if (is_animated) {
				effect.nodes?.a?.unfix();
				(to_animate ??= new Set()).delete(effect);
			}
		}

		if (effect !== current) {
			if (seen !== undefined && seen.has(effect)) {
				if (matched.length < stashed.length) {
					// more efficient to move later items to the front
					var start = stashed[0];
					var j;

					prev = start.prev;

					var a = matched[0];
					var b = matched[matched.length - 1];

					for (j = 0; j < matched.length; j += 1) {
						move(matched[j], start, anchor);
					}

					for (j = 0; j < stashed.length; j += 1) {
						seen.delete(stashed[j]);
					}

					link(state, a.prev, b.next);
					link(state, prev, a);
					link(state, b, start);

					current = start;
					prev = b;
					i -= 1;

					matched = [];
					stashed = [];
				} else {
					// more efficient to move earlier items to the back
					seen.delete(effect);
					move(effect, current, anchor);

					link(state, effect.prev, effect.next);
					link(state, effect, prev === null ? state.effect.first : prev.next);
					link(state, prev, effect);

					prev = effect;
				}

				continue;
			}

			matched = [];
			stashed = [];

			while (current !== null && current !== effect) {
				(seen ??= new Set()).add(current);
				stashed.push(current);
				current = current.next;
			}

			if (current === null) {
				continue;
			}
		}

		if ((effect.f & EFFECT_OFFSCREEN) === 0) {
			matched.push(effect);
		}

		prev = effect;
		current = effect.next;
	}

	if (state.outrogroups !== null) {
		for (const group of state.outrogroups) {
			if (group.pending.size === 0) {
				destroy_effects(array_from(group.done));
				state.outrogroups?.delete(group);
			}
		}

		if (state.outrogroups.size === 0) {
			state.outrogroups = null;
		}
	}

	if (current !== null || seen !== undefined) {
		/** @type {Effect[]} */
		var to_destroy = [];

		if (seen !== undefined) {
			for (effect of seen) {
				if ((effect.f & INERT) === 0) {
					to_destroy.push(effect);
				}
			}
		}

		while (current !== null) {
			// If the each block isn't inert, then inert effects are currently outroing and will be removed once the transition is finished
			if ((current.f & INERT) === 0 && current !== state.fallback) {
				to_destroy.push(current);
			}

			current = current.next;
		}

		var destroy_length = to_destroy.length;

		if (destroy_length > 0) {
			var controlled_anchor = (flags & EACH_IS_CONTROLLED) !== 0 && length === 0 ? anchor : null;

			if (is_animated) {
				for (i = 0; i < destroy_length; i += 1) {
					to_destroy[i].nodes?.a?.measure();
				}

				for (i = 0; i < destroy_length; i += 1) {
					to_destroy[i].nodes?.a?.fix();
				}
			}

			pause_effects(state, to_destroy, controlled_anchor);
		}
	}

	if (is_animated) {
		queue_micro_task(() => {
			if (to_animate === undefined) return;
			for (effect of to_animate) {
				effect.nodes?.a?.apply();
			}
		});
	}
}

/**
 * @template V
 * @param {Map<any, EachItem>} items
 * @param {Node} anchor
 * @param {V} value
 * @param {unknown} key
 * @param {number} index
 * @param {(anchor: Node, item: V | Source<V>, index: number | Value<number>, collection: () => V[]) => void} render_fn
 * @param {number} flags
 * @param {() => V[]} get_collection
 * @returns {EachItem}
 */
function create_item(items, anchor, value, key, index, render_fn, flags, get_collection) {
	var v =
		(flags & EACH_ITEM_REACTIVE) !== 0
			? (flags & EACH_ITEM_IMMUTABLE) === 0
				? mutable_source(value, false, false)
				: source(value)
			: null;

	var i = (flags & EACH_INDEX_REACTIVE) !== 0 ? source(index) : null;

	return {
		v,
		i,
		e: branch(() => {
			render_fn(anchor, v ?? value, i ?? index, get_collection);

			return () => {
				items.delete(key);
			};
		})
	};
}

/**
 * @param {Effect} effect
 * @param {Effect | null} next
 * @param {Text | Element | Comment} anchor
 */
function move(effect, next, anchor) {
	if (!effect.nodes) return;

	var node = effect.nodes.start;
	var end = effect.nodes.end;

	var dest =
		next && (next.f & EFFECT_OFFSCREEN) === 0
			? /** @type {EffectNodes} */ (next.nodes).start
			: anchor;

	while (node !== null) {
		var next_node = /** @type {TemplateNode} */ (get_next_sibling(node));
		dest.before(node);

		if (node === end) {
			return;
		}

		node = next_node;
	}
}

/**
 * @param {EachState} state
 * @param {Effect | null} prev
 * @param {Effect | null} next
 */
function link(state, prev, next) {
	if (prev === null) {
		state.effect.first = next;
	} else {
		prev.next = next;
	}

	if (next === null) {
		state.effect.last = prev;
	} else {
		next.prev = prev;
	}
}

const whitespace = [...' \t\n\r\f\u00a0\u000b\ufeff'];

/**
 * @param {any} value
 * @param {string | null} [hash]
 * @param {Record<string, boolean>} [directives]
 * @returns {string | null}
 */
function to_class(value, hash, directives) {
	var classname = value == null ? '' : '' + value;

	if (directives) {
		for (var key in directives) {
			if (directives[key]) {
				classname = classname ? classname + ' ' + key : key;
			} else if (classname.length) {
				var len = key.length;
				var a = 0;

				while ((a = classname.indexOf(key, a)) >= 0) {
					var b = a + len;

					if (
						(a === 0 || whitespace.includes(classname[a - 1])) &&
						(b === classname.length || whitespace.includes(classname[b]))
					) {
						classname = (a === 0 ? '' : classname.substring(0, a)) + classname.substring(b + 1);
					} else {
						a = b;
					}
				}
			}
		}
	}

	return classname === '' ? null : classname;
}

/**
 * @param {Element} dom
 * @param {boolean | number} is_html
 * @param {string | null} value
 * @param {string} [hash]
 * @param {Record<string, any>} [prev_classes]
 * @param {Record<string, any>} [next_classes]
 * @returns {Record<string, boolean> | undefined}
 */
function set_class(dom, is_html, value, hash, prev_classes, next_classes) {
	// @ts-expect-error need to add __className to patched prototype
	var prev = dom.__className;

	if (
		hydrating ||
		prev !== value ||
		prev === undefined // for edge case of `class={undefined}`
	) {
		var next_class_name = to_class(value, hash, next_classes);

		if (!hydrating || next_class_name !== dom.getAttribute('class')) {
			// Removing the attribute when the value is only an empty string causes
			// performance issues vs simply making the className an empty string. So
			// we should only remove the class if the value is nullish
			// and there no hash/directives :
			if (next_class_name == null) {
				dom.removeAttribute('class');
			} else {
				dom.className = next_class_name;
			}
		}

		// @ts-expect-error need to add __className to patched prototype
		dom.__className = value;
	} else if (next_classes && prev_classes !== next_classes) {
		for (var key in next_classes) {
			var is_present = !!next_classes[key];

			if (prev_classes == null || is_present !== !!prev_classes[key]) {
				dom.classList.toggle(key, is_present);
			}
		}
	}

	return next_classes;
}

/**
 * Selects the correct option(s) (depending on whether this is a multiple select)
 * @template V
 * @param {HTMLSelectElement} select
 * @param {V} value
 * @param {boolean} mounting
 */
function select_option(select, value, mounting = false) {
	if (select.multiple) {
		// If value is null or undefined, keep the selection as is
		if (value == undefined) {
			return;
		}

		// If not an array, warn and keep the selection as is
		if (!is_array(value)) {
			return select_multiple_invalid_value();
		}

		// Otherwise, update the selection
		for (var option of select.options) {
			option.selected = value.includes(get_option_value(option));
		}

		return;
	}

	for (option of select.options) {
		var option_value = get_option_value(option);
		if (is(option_value, value)) {
			option.selected = true;
			return;
		}
	}

	if (!mounting || value !== undefined) {
		select.selectedIndex = -1; // no option should be selected
	}
}

/**
 * Selects the correct option(s) if `value` is given,
 * and then sets up a mutation observer to sync the
 * current selection to the dom when it changes. Such
 * changes could for example occur when options are
 * inside an `#each` block.
 * @param {HTMLSelectElement} select
 */
function init_select(select) {
	var observer = new MutationObserver(() => {
		// @ts-ignore
		select_option(select, select.__value);
		// Deliberately don't update the potential binding value,
		// the model should be preserved unless explicitly changed
	});

	observer.observe(select, {
		// Listen to option element changes
		childList: true,
		subtree: true, // because of <optgroup>
		// Listen to option element value attribute changes
		// (doesn't get notified of select value changes,
		// because that property is not reflected as an attribute)
		attributes: true,
		attributeFilter: ['value']
	});

	teardown(() => {
		observer.disconnect();
	});
}

/**
 * @param {HTMLSelectElement} select
 * @param {() => unknown} get
 * @param {(value: unknown) => void} set
 * @returns {void}
 */
function bind_select_value(select, get, set = get) {
	var batches = new WeakSet();
	var mounting = true;

	listen_to_event_and_reset_event(select, 'change', (is_reset) => {
		var query = is_reset ? '[selected]' : ':checked';
		/** @type {unknown} */
		var value;

		if (select.multiple) {
			value = [].map.call(select.querySelectorAll(query), get_option_value);
		} else {
			/** @type {HTMLOptionElement | null} */
			var selected_option =
				select.querySelector(query) ??
				// will fall back to first non-disabled option if no option is selected
				select.querySelector('option:not([disabled])');
			value = selected_option && get_option_value(selected_option);
		}

		set(value);

		if (current_batch !== null) {
			batches.add(current_batch);
		}
	});

	// Needs to be an effect, not a render_effect, so that in case of each loops the logic runs after the each block has updated
	effect(() => {
		var value = get();

		if (select === document.activeElement) {
			// we need both, because in non-async mode, render effects run before previous_batch is set
			var batch = /** @type {Batch} */ (previous_batch ?? current_batch);

			// Don't update the <select> if it is focused. We can get here if, for example,
			// an update is deferred because of async work depending on the select:
			//
			// <select bind:value={selected}>...</select>
			// <p>{await find(selected)}</p>
			if (batches.has(batch)) {
				return;
			}
		}

		select_option(select, value, mounting);

		// Mounting and value undefined -> take selection from dom
		if (mounting && value === undefined) {
			/** @type {HTMLOptionElement | null} */
			var selected_option = select.querySelector(':checked');
			if (selected_option !== null) {
				value = get_option_value(selected_option);
				set(value);
			}
		}

		// @ts-ignore
		select.__value = value;
		mounting = false;
	});

	init_select(select);
}

/** @param {HTMLOptionElement} option */
function get_option_value(option) {
	// __value only exists if the <option> has a value attribute
	if ('__value' in option) {
		return option.__value;
	} else {
		return option.value;
	}
}

/** @import { Effect } from '#client' */

const IS_CUSTOM_ELEMENT = Symbol('is custom element');
const IS_HTML = Symbol('is html');

/**
 * The value/checked attribute in the template actually corresponds to the defaultValue property, so we need
 * to remove it upon hydration to avoid a bug when someone resets the form value.
 * @param {HTMLInputElement} input
 * @returns {void}
 */
function remove_input_defaults(input) {
	if (!hydrating) return;

	var already_removed = false;

	// We try and remove the default attributes later, rather than sync during hydration.
	// Doing it sync during hydration has a negative impact on performance, but deferring the
	// work in an idle task alleviates this greatly. If a form reset event comes in before
	// the idle callback, then we ensure the input defaults are cleared just before.
	var remove_defaults = () => {
		if (already_removed) return;
		already_removed = true;

		// Remove the attributes but preserve the values
		if (input.hasAttribute('value')) {
			var value = input.value;
			set_attribute(input, 'value', null);
			input.value = value;
		}

		if (input.hasAttribute('checked')) {
			var checked = input.checked;
			set_attribute(input, 'checked', null);
			input.checked = checked;
		}
	};

	// @ts-expect-error
	input.__on_r = remove_defaults;
	queue_micro_task(remove_defaults);
	add_form_reset_listener();
}

/**
 * @param {Element} element
 * @param {any} value
 */
function set_value(element, value) {
	var attributes = get_attributes(element);

	if (
		attributes.value ===
			(attributes.value =
				// treat null and undefined the same for the initial value
				value ?? undefined) ||
		// @ts-expect-error
		// `progress` elements always need their value set when it's `0`
		(element.value === value && (value !== 0 || element.nodeName !== 'PROGRESS'))
	) {
		return;
	}

	// @ts-expect-error
	element.value = value ?? '';
}

/**
 * @param {Element} element
 * @param {string} attribute
 * @param {string | null} value
 * @param {boolean} [skip_warning]
 */
function set_attribute(element, attribute, value, skip_warning) {
	var attributes = get_attributes(element);

	if (hydrating) {
		attributes[attribute] = element.getAttribute(attribute);

		if (
			attribute === 'src' ||
			attribute === 'srcset' ||
			(attribute === 'href' && element.nodeName === 'LINK')
		) {

			// If we reset these attributes, they would result in another network request, which we want to avoid.
			// We assume they are the same between client and server as checking if they are equal is expensive
			// (we can't just compare the strings as they can be different between client and server but result in the
			// same url, so we would need to create hidden anchor elements to compare them)
			return;
		}
	}

	if (attributes[attribute] === (attributes[attribute] = value)) return;

	if (attribute === 'loading') {
		// @ts-expect-error
		element[LOADING_ATTR_SYMBOL] = value;
	}

	if (value == null) {
		element.removeAttribute(attribute);
	} else if (typeof value !== 'string' && get_setters(element).includes(attribute)) {
		// @ts-ignore
		element[attribute] = value;
	} else {
		element.setAttribute(attribute, value);
	}
}

/**
 *
 * @param {Element} element
 */
function get_attributes(element) {
	return /** @type {Record<string | symbol, unknown>} **/ (
		// @ts-expect-error
		element.__attributes ??= {
			[IS_CUSTOM_ELEMENT]: element.nodeName.includes('-'),
			[IS_HTML]: element.namespaceURI === NAMESPACE_HTML
		}
	);
}

/** @type {Map<string, string[]>} */
var setters_cache = new Map();

/** @param {Element} element */
function get_setters(element) {
	var cache_key = element.getAttribute('is') || element.nodeName;
	var setters = setters_cache.get(cache_key);
	if (setters) return setters;
	setters_cache.set(cache_key, (setters = []));

	var descriptors;
	var proto = element; // In the case of custom elements there might be setters on the instance
	var element_proto = Element.prototype;

	// Stop at Element, from there on there's only unnecessary setters we're not interested in
	// Do not use contructor.name here as that's unreliable in some browser environments
	while (element_proto !== proto) {
		descriptors = get_descriptors(proto);

		for (var key in descriptors) {
			if (descriptors[key].set) {
				setters.push(key);
			}
		}

		proto = get_prototype_of(proto);
	}

	return setters;
}

/** @import { Batch } from '../../../reactivity/batch.js' */

/**
 * @param {HTMLInputElement} input
 * @param {() => unknown} get
 * @param {(value: unknown) => void} set
 * @returns {void}
 */
function bind_value(input, get, set = get) {
	var batches = new WeakSet();

	listen_to_event_and_reset_event(input, 'input', async (is_reset) => {

		/** @type {any} */
		var value = is_reset ? input.defaultValue : input.value;
		value = is_numberlike_input(input) ? to_number(value) : value;
		set(value);

		if (current_batch !== null) {
			batches.add(current_batch);
		}

		// Because `{#each ...}` blocks work by updating sources inside the flush,
		// we need to wait a tick before checking to see if we should forcibly
		// update the input and reset the selection state
		await tick();

		// Respect any validation in accessors
		if (value !== (value = get())) {
			var start = input.selectionStart;
			var end = input.selectionEnd;
			var length = input.value.length;

			// the value is coerced on assignment
			input.value = value ?? '';

			// Restore selection
			if (end !== null) {
				var new_length = input.value.length;
				// If cursor was at end and new input is longer, move cursor to new end
				if (start === end && end === length && new_length > length) {
					input.selectionStart = new_length;
					input.selectionEnd = new_length;
				} else {
					input.selectionStart = start;
					input.selectionEnd = Math.min(end, new_length);
				}
			}
		}
	});

	if (
		// If we are hydrating and the value has since changed,
		// then use the updated value from the input instead.
		(hydrating && input.defaultValue !== input.value) ||
		// If defaultValue is set, then value == defaultValue
		// TODO Svelte 6: remove input.value check and set to empty string?
		(untrack(get) == null && input.value)
	) {
		set(is_numberlike_input(input) ? to_number(input.value) : input.value);

		if (current_batch !== null) {
			batches.add(current_batch);
		}
	}

	render_effect(() => {

		var value = get();

		if (input === document.activeElement) {
			// we need both, because in non-async mode, render effects run before previous_batch is set
			var batch = /** @type {Batch} */ (previous_batch ?? current_batch);

			// Never rewrite the contents of a focused input. We can get here if, for example,
			// an update is deferred because of async work depending on the input:
			//
			// <input bind:value={query}>
			// <p>{await find(query)}</p>
			if (batches.has(batch)) {
				return;
			}
		}

		if (is_numberlike_input(input) && value === to_number(input.value)) {
			// handles 0 vs 00 case (see https://github.com/sveltejs/svelte/issues/9959)
			return;
		}

		if (input.type === 'date' && !value && !input.value) {
			// Handles the case where a temporarily invalid date is set (while typing, for example with a leading 0 for the day)
			// and prevents this state from clearing the other parts of the date input (see https://github.com/sveltejs/svelte/issues/7897)
			return;
		}

		// don't set the value of the input if it's the same to allow
		// minlength to work properly
		if (value !== input.value) {
			// @ts-expect-error the value is coerced on assignment
			input.value = value ?? '';
		}
	});
}

/**
 * @param {HTMLInputElement} input
 * @param {() => unknown} get
 * @param {(value: unknown) => void} set
 * @returns {void}
 */
function bind_checked(input, get, set = get) {
	listen_to_event_and_reset_event(input, 'change', (is_reset) => {
		var value = is_reset ? input.defaultChecked : input.checked;
		set(value);
	});

	if (
		// If we are hydrating and the value has since changed,
		// then use the update value from the input instead.
		(hydrating && input.defaultChecked !== input.checked) ||
		// If defaultChecked is set, then checked == defaultChecked
		untrack(get) == null
	) {
		set(input.checked);
	}

	render_effect(() => {
		var value = get();
		input.checked = Boolean(value);
	});
}

/**
 * @param {HTMLInputElement} input
 */
function is_numberlike_input(input) {
	var type = input.type;
	return type === 'number' || type === 'range';
}

/**
 * @param {string} value
 */
function to_number(value) {
	return value === '' ? null : +value;
}

var root_2 = from_html(`<option class="svelte-10fangs"> </option>`);
var root_3 = from_html(`<div class="empty-state svelte-10fangs"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="svelte-10fangs"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" class="svelte-10fangs"></path></svg> <p class="svelte-10fangs">No prompts found</p> <button class="btn btn-primary svelte-10fangs">Create your first prompt</button></div>`);
var root_7 = from_html(`<span class="tag svelte-10fangs"> </span>`);
var root_6 = from_html(`<div class="tags svelte-10fangs"></div>`);
var root_8 = from_html(`<div class="variables-badge svelte-10fangs"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="svelte-10fangs"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" class="svelte-10fangs"></path><polyline points="22,6 12,13 2,6" class="svelte-10fangs"></polyline></svg> </div>`);
var root_5 = from_html(`<div class="prompt-card svelte-10fangs"><div class="prompt-header svelte-10fangs"><button><svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="svelte-10fangs"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" class="svelte-10fangs"></polygon></svg></button> <h3 class="svelte-10fangs"> </h3> <span class="category-badge svelte-10fangs"> </span></div> <p class="prompt-preview svelte-10fangs"> </p> <!> <!> <div class="prompt-actions svelte-10fangs"><button class="btn btn-icon svelte-10fangs" title="Edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="svelte-10fangs"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" class="svelte-10fangs"></path><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" class="svelte-10fangs"></path></svg></button> <button class="btn btn-icon svelte-10fangs" title="Duplicate"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="svelte-10fangs"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" class="svelte-10fangs"></rect><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" class="svelte-10fangs"></path></svg></button> <button class="btn btn-icon svelte-10fangs" title="Copy"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="svelte-10fangs"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" class="svelte-10fangs"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1" class="svelte-10fangs"></rect></svg></button> <button class="btn btn-icon btn-danger svelte-10fangs" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="svelte-10fangs"><polyline points="3 6 5 6 21 6" class="svelte-10fangs"></polyline><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" class="svelte-10fangs"></path></svg></button></div></div>`);
var root_1 = from_html(`<div class="toolbar svelte-10fangs"><div class="search-box svelte-10fangs"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="svelte-10fangs"><circle cx="11" cy="11" r="8" class="svelte-10fangs"></circle><line x1="21" y1="21" x2="16.65" y2="16.65" class="svelte-10fangs"></line></svg> <input type="text" placeholder="Search prompts..." class="svelte-10fangs"/></div> <div class="filters svelte-10fangs"><select class="svelte-10fangs"></select> <label class="checkbox-label svelte-10fangs"><input type="checkbox" class="svelte-10fangs"/> <span class="svelte-10fangs">Favorites only</span></label></div></div> <div class="prompts-list svelte-10fangs"><!></div>`, 1);
var root_11 = from_html(`<option class="svelte-10fangs"> </option>`);
var root_13 = from_html(`<div class="variable-config svelte-10fangs"><div class="variable-name svelte-10fangs"> </div> <input type="text" placeholder="Default value" class="svelte-10fangs"/> <input type="text" placeholder="Description" class="svelte-10fangs"/></div>`);
var root_12 = from_html(`<div class="variables-section svelte-10fangs"><h4 class="svelte-10fangs">Variables</h4> <!></div>`);
var root_10 = from_html(`<div class="edit-form svelte-10fangs"><div class="form-group svelte-10fangs"><label for="title" class="svelte-10fangs">Title</label> <input id="title" type="text" placeholder="Enter prompt title..." class="svelte-10fangs"/></div> <div class="form-row svelte-10fangs"><div class="form-group svelte-10fangs"><label for="category" class="svelte-10fangs">Category</label> <select id="category" class="svelte-10fangs"></select></div> <div class="form-group svelte-10fangs"><label for="tags" class="svelte-10fangs">Tags (comma-separated)</label> <input id="tags" type="text" placeholder="e.g. coding, python, debug" class="svelte-10fangs"/></div></div> <div class="form-group svelte-10fangs"><label for="template" class="svelte-10fangs">Template <span class="hint svelte-10fangs"></span></label> <textarea id="template" placeholder="Enter your prompt template..." rows="8" class="svelte-10fangs"></textarea></div> <!> <div class="form-actions svelte-10fangs"><button class="btn btn-secondary svelte-10fangs">Cancel</button> <button class="btn btn-primary svelte-10fangs"> </button></div></div>`);
var root_17 = from_html(`<span class="var-desc svelte-10fangs"> </span>`);
var root_16 = from_html(`<div class="preview-variable-input svelte-10fangs"><label class="svelte-10fangs"> <!></label> <input type="text" class="svelte-10fangs"/></div>`);
var root_15 = from_html(`<div class="preview-variables svelte-10fangs"><h4 class="svelte-10fangs">Fill in Variables</h4> <!></div>`);
var root_14 = from_html(`<div class="preview-section svelte-10fangs"><!> <div class="preview-output svelte-10fangs"><div class="preview-header svelte-10fangs"><h4 class="svelte-10fangs">Preview</h4> <button class="btn btn-icon svelte-10fangs" title="Copy"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="svelte-10fangs"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" class="svelte-10fangs"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1" class="svelte-10fangs"></rect></svg></button></div> <pre class="preview-text svelte-10fangs"> </pre></div></div>`);
var root_9 = from_html(`<div class="edit-container svelte-10fangs"><div class="edit-tabs svelte-10fangs"><button>Edit</button> <button>Preview</button></div> <!></div>`);
var root = from_html(`<div class="prompt-manager svelte-10fangs"><header class="header svelte-10fangs"><h1 class="svelte-10fangs">Prompt Manager</h1> <div class="header-actions svelte-10fangs"><button class="btn btn-primary svelte-10fangs"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="svelte-10fangs"><line x1="12" y1="5" x2="12" y2="19" class="svelte-10fangs"></line><line x1="5" y1="12" x2="19" y2="12" class="svelte-10fangs"></line></svg> New Prompt</button> <button class="btn btn-secondary svelte-10fangs">Export</button> <label class="btn btn-secondary svelte-10fangs">Import <input type="file" accept=".json" hidden="" class="svelte-10fangs"/></label></div></header> <!></div>`);

function PromptManager($$anchor, $$props) {
	push($$props, true);

	const STORAGE_KEY = 'desktop-os-prompts';

	const CATEGORIES = [
		'General',
		'Coding',
		'Writing',
		'Analysis',
		'Creative',
		'Business',
		'Custom'
	];

	// State
	let prompts = state(proxy([]));

	let searchQuery = state('');
	let selectedCategory = state('All');
	let showFavoritesOnly = state(false);
	let editingPrompt = state(null);
	let isCreating = state(false);
	let previewVariables = state(proxy({}));
	let activeTab = state('list');

	// Form state
	let formTitle = state('');

	let formTemplate = state('');
	let formCategory = state('General');
	let formTags = state('');
	let formVariables = state(proxy([]));

	// Derived
	let filteredPrompts = user_derived(() => {
		let result = get(prompts);

		if (get(searchQuery).trim()) {
			const query = get(searchQuery).toLowerCase();

			result = result.filter((p) => p.title.toLowerCase().includes(query) || p.template.toLowerCase().includes(query) || p.tags.some((t) => t.toLowerCase().includes(query)));
		}

		if (get(selectedCategory) !== 'All') {
			result = result.filter((p) => p.category === get(selectedCategory));
		}

		if (get(showFavoritesOnly)) {
			result = result.filter((p) => p.isFavorite);
		}

		return result.sort((a, b) => {
			if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;

			return b.updatedAt - a.updatedAt;
		});
	});

	let extractedVariables = user_derived(() => {
		const regex = /\{\{(\w+)\}\}/g;
		const vars = [];
		let match;

		while ((match = regex.exec(get(formTemplate))) !== null) {
			if (!vars.includes(match[1])) {
				vars.push(match[1]);
			}
		}

		return vars;
	});

	let previewText = user_derived(() => {
		let text = get(editingPrompt)?.template || get(formTemplate);
		const vars = get(editingPrompt)?.variables || get(formVariables);

		for (const v of vars) {
			const value = get(previewVariables)[v.name] || v.defaultValue || `{{${v.name}}}`;

			text = text.replace(new RegExp(`\\{\\{${v.name}\\}\\}`, 'g'), value);
		}

		return text;
	});

	let allCategories = user_derived(() => ['All', ...CATEGORIES]);

	// Load from localStorage
	user_effect(() => {
		const stored = localStorage.getItem(STORAGE_KEY);

		if (stored) {
			try {
				set(prompts, JSON.parse(stored), true);
			} catch {
				set(prompts, [], true);
			}
		}
	});

	// Save to localStorage
	user_effect(() => {
		if (get(prompts).length > 0 || localStorage.getItem(STORAGE_KEY)) {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(get(prompts)));
		}
	});

	// Sync form variables with extracted
	user_effect(() => {
		if (get(isCreating) || get(editingPrompt)) {
			const existing = new Map(get(formVariables).map((v) => [v.name, v]));

			set(formVariables, get(extractedVariables).map((name) => existing.get(name) || { name, defaultValue: '', description: '' }), true);
		}
	});

	function generateId() {
		return Date.now().toString(36) + Math.random().toString(36).substr(2);
	}

	function startCreate() {
		set(isCreating, true);
		set(editingPrompt, null);
		set(formTitle, '');
		set(formTemplate, '');
		set(formCategory, 'General');
		set(formTags, '');
		set(formVariables, [], true);
		set(previewVariables, {}, true);
		set(activeTab, 'edit');
	}

	function startEdit(prompt) {
		set(isCreating, false);
		set(editingPrompt, prompt, true);
		set(formTitle, prompt.title, true);
		set(formTemplate, prompt.template, true);
		set(formCategory, prompt.category, true);
		set(formTags, prompt.tags.join(', '), true);
		set(formVariables, [...prompt.variables], true);
		set(previewVariables, Object.fromEntries(prompt.variables.map((v) => [v.name, v.defaultValue])), true);
		set(activeTab, 'edit');
	}

	function savePrompt() {
		if (!get(formTitle).trim() || !get(formTemplate).trim()) return;

		const now = Date.now();
		const tags = get(formTags).split(',').map((t) => t.trim()).filter(Boolean);

		if (get(editingPrompt)) {
			set(
				prompts,
				get(prompts).map((p) => p.id === get(editingPrompt).id
					? {
						...p,
						title: get(formTitle),
						template: get(formTemplate),
						variables: get(formVariables),
						category: get(formCategory),
						tags,
						updatedAt: now
					}
					: p),
				true
			);
		} else {
			const newPrompt = {
				id: generateId(),
				title: get(formTitle),
				template: get(formTemplate),
				variables: get(formVariables),
				category: get(formCategory),
				tags,
				isFavorite: false,
				createdAt: now,
				updatedAt: now
			};

			set(prompts, [newPrompt, ...get(prompts)], true);
		}

		cancelEdit();
	}

	function cancelEdit() {
		set(isCreating, false);
		set(editingPrompt, null);
		set(activeTab, 'list');
	}

	function deletePrompt(id) {
		if (confirm('Are you sure you want to delete this prompt?')) {
			set(prompts, get(prompts).filter((p) => p.id !== id), true);

			if (get(editingPrompt)?.id === id) {
				cancelEdit();
			}
		}
	}

	function toggleFavorite(id) {
		set(prompts, get(prompts).map((p) => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p), true);
	}

	function duplicatePrompt(prompt) {
		const newPrompt = {
			...prompt,
			id: generateId(),
			title: `${prompt.title} (Copy)`,
			isFavorite: false,
			createdAt: Date.now(),
			updatedAt: Date.now()
		};

		set(prompts, [newPrompt, ...get(prompts)], true);
	}

	function copyToClipboard(text) {
		navigator.clipboard.writeText(text);
	}

	function exportPrompts() {
		const data = JSON.stringify(get(prompts), null, 2);
		const blob = new Blob([data], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');

		a.href = url;
		a.download = `prompts-${new Date().toISOString().split('T')[0]}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function importPrompts(event) {
		const input = event.target;
		const file = input.files?.[0];

		if (!file) return;

		const reader = new FileReader();

		reader.onload = (e) => {
			try {
				const imported = JSON.parse(e.target?.result);

				const newPrompts = imported.map((p) => ({
					...p,
					id: generateId(),
					createdAt: Date.now(),
					updatedAt: Date.now()
				}));

				set(prompts, [...newPrompts, ...get(prompts)], true);
				alert(`Imported ${newPrompts.length} prompts successfully!`);
			} catch {
				alert('Failed to import prompts. Invalid file format.');
			}
		};

		reader.readAsText(file);
		input.value = '';
	}

	function updateVariableValue(name, value) {
		set(previewVariables, { ...get(previewVariables), [name]: value }, true);
	}

	function updateVariableDefault(index, value) {
		set(formVariables, get(formVariables).map((v, i) => i === index ? { ...v, defaultValue: value } : v), true);
	}

	function updateVariableDescription(index, value) {
		set(formVariables, get(formVariables).map((v, i) => i === index ? { ...v, description: value } : v), true);
	}

	var div = root();
	var header = child(div);
	var div_1 = sibling(child(header), 2);
	var button = child(div_1);

	button.__click = startCreate;

	var button_1 = sibling(button, 2);

	button_1.__click = exportPrompts;

	var label = sibling(button_1, 2);
	var input_1 = sibling(child(label));

	input_1.__change = importPrompts;
	reset(label);
	reset(div_1);
	reset(header);

	var node = sibling(header, 2);

	{
		var consequent_3 = ($$anchor) => {
			var fragment = root_1();
			var div_2 = first_child(fragment);
			var div_3 = child(div_2);
			var input_2 = sibling(child(div_3), 2);

			remove_input_defaults(input_2);
			reset(div_3);

			var div_4 = sibling(div_3, 2);
			var select = child(div_4);

			each(select, 21, () => get(allCategories), index, ($$anchor, cat) => {
				var option = root_2();
				var text_1 = child(option, true);

				reset(option);

				var option_value = {};

				template_effect(() => {
					set_text(text_1, get(cat));

					if (option_value !== (option_value = get(cat))) {
						option.value = (option.__value = get(cat)) ?? '';
					}
				});

				append($$anchor, option);
			});

			reset(select);

			var label_1 = sibling(select, 2);
			var input_3 = child(label_1);

			remove_input_defaults(input_3);
			next(2);
			reset(label_1);
			reset(div_4);
			reset(div_2);

			var div_5 = sibling(div_2, 2);
			var node_1 = child(div_5);

			{
				var consequent = ($$anchor) => {
					var div_6 = root_3();
					var button_2 = sibling(child(div_6), 4);

					button_2.__click = startCreate;
					reset(div_6);
					append($$anchor, div_6);
				};

				var alternate = ($$anchor) => {
					var fragment_1 = comment();
					var node_2 = first_child(fragment_1);

					each(node_2, 17, () => get(filteredPrompts), (prompt) => prompt.id, ($$anchor, prompt) => {
						var div_7 = root_5();
						var div_8 = child(div_7);
						var button_3 = child(div_8);
						let classes;

						button_3.__click = () => toggleFavorite(get(prompt).id);

						var svg = child(button_3);

						reset(button_3);

						var h3 = sibling(button_3, 2);
						var text_2 = child(h3, true);

						reset(h3);

						var span = sibling(h3, 2);
						var text_3 = child(span, true);

						reset(span);
						reset(div_8);

						var p_1 = sibling(div_8, 2);
						var text_4 = child(p_1);

						reset(p_1);

						var node_3 = sibling(p_1, 2);

						{
							var consequent_1 = ($$anchor) => {
								var div_9 = root_6();

								each(div_9, 21, () => get(prompt).tags, index, ($$anchor, tag) => {
									var span_1 = root_7();
									var text_5 = child(span_1, true);

									reset(span_1);
									template_effect(() => set_text(text_5, get(tag)));
									append($$anchor, span_1);
								});

								reset(div_9);
								append($$anchor, div_9);
							};

							if_block(node_3, ($$render) => {
								if (get(prompt).tags.length > 0) $$render(consequent_1);
							});
						}

						var node_4 = sibling(node_3, 2);

						{
							var consequent_2 = ($$anchor) => {
								var div_10 = root_8();
								var text_6 = sibling(child(div_10));

								reset(div_10);
								template_effect(() => set_text(text_6, ` ${get(prompt).variables.length ?? ''} variable${get(prompt).variables.length !== 1 ? 's' : ''}`));
								append($$anchor, div_10);
							};

							if_block(node_4, ($$render) => {
								if (get(prompt).variables.length > 0) $$render(consequent_2);
							});
						}

						var div_11 = sibling(node_4, 2);
						var button_4 = child(div_11);

						button_4.__click = () => startEdit(get(prompt));

						var button_5 = sibling(button_4, 2);

						button_5.__click = () => duplicatePrompt(get(prompt));

						var button_6 = sibling(button_5, 2);

						button_6.__click = () => copyToClipboard(get(prompt).template);

						var button_7 = sibling(button_6, 2);

						button_7.__click = () => deletePrompt(get(prompt).id);
						reset(div_11);
						reset(div_7);

						template_effect(
							($0) => {
								classes = set_class(button_3, 1, 'favorite-btn svelte-10fangs', null, classes, { active: get(prompt).isFavorite });
								set_attribute(svg, 'fill', get(prompt).isFavorite ? 'currentColor' : 'none');
								set_text(text_2, get(prompt).title);
								set_text(text_3, get(prompt).category);
								set_text(text_4, `${$0 ?? ''}${get(prompt).template.length > 150 ? '...' : ''}`);
							},
							[() => get(prompt).template.slice(0, 150)]
						);

						append($$anchor, div_7);
					});

					append($$anchor, fragment_1);
				};

				if_block(node_1, ($$render) => {
					if (get(filteredPrompts).length === 0) $$render(consequent); else $$render(alternate, false);
				});
			}

			reset(div_5);
			bind_value(input_2, () => get(searchQuery), ($$value) => set(searchQuery, $$value));
			bind_select_value(select, () => get(selectedCategory), ($$value) => set(selectedCategory, $$value));
			bind_checked(input_3, () => get(showFavoritesOnly), ($$value) => set(showFavoritesOnly, $$value));
			append($$anchor, fragment);
		};

		var alternate_2 = ($$anchor) => {
			var div_12 = root_9();
			var div_13 = child(div_12);
			var button_8 = child(div_13);
			let classes_1;

			button_8.__click = () => set(activeTab, 'edit');

			var button_9 = sibling(button_8, 2);
			let classes_2;

			button_9.__click = () => set(activeTab, 'preview');
			reset(div_13);

			var node_5 = sibling(div_13, 2);

			{
				var consequent_5 = ($$anchor) => {
					var div_14 = root_10();
					var div_15 = child(div_14);
					var input_4 = sibling(child(div_15), 2);

					remove_input_defaults(input_4);
					reset(div_15);

					var div_16 = sibling(div_15, 2);
					var div_17 = child(div_16);
					var select_1 = sibling(child(div_17), 2);

					each(select_1, 21, () => CATEGORIES, index, ($$anchor, cat) => {
						var option_1 = root_11();
						var text_7 = child(option_1, true);

						reset(option_1);

						var option_1_value = {};

						template_effect(() => {
							set_text(text_7, get(cat));

							if (option_1_value !== (option_1_value = get(cat))) {
								option_1.value = (option_1.__value = get(cat)) ?? '';
							}
						});

						append($$anchor, option_1);
					});

					reset(select_1);
					reset(div_17);

					var div_18 = sibling(div_17, 2);
					var input_5 = sibling(child(div_18), 2);

					remove_input_defaults(input_5);
					reset(div_18);
					reset(div_16);

					var div_19 = sibling(div_16, 2);
					var label_2 = child(div_19);
					var span_2 = sibling(child(label_2));

					span_2.textContent = 'Use {{variableName}} for variables';
					reset(label_2);

					var textarea = sibling(label_2, 2);

					remove_textarea_child(textarea);
					reset(div_19);

					var node_6 = sibling(div_19, 2);

					{
						var consequent_4 = ($$anchor) => {
							var div_20 = root_12();
							var node_7 = sibling(child(div_20), 2);

							each(node_7, 19, () => get(formVariables), (variable) => variable.name, ($$anchor, variable, i) => {
								var div_21 = root_13();
								var div_22 = child(div_21);
								var text_8 = child(div_22, true);

								reset(div_22);

								var input_6 = sibling(div_22, 2);

								remove_input_defaults(input_6);
								input_6.__input = (e) => updateVariableDefault(get(i), e.target.value);

								var input_7 = sibling(input_6, 2);

								remove_input_defaults(input_7);
								input_7.__input = (e) => updateVariableDescription(get(i), e.target.value);
								reset(div_21);

								template_effect(() => {
									set_text(text_8, `{{${get(variable).name}}}`);
									set_value(input_6, get(variable).defaultValue);
									set_value(input_7, get(variable).description);
								});

								append($$anchor, div_21);
							});

							reset(div_20);
							append($$anchor, div_20);
						};

						if_block(node_6, ($$render) => {
							if (get(formVariables).length > 0) $$render(consequent_4);
						});
					}

					var div_23 = sibling(node_6, 2);
					var button_10 = child(div_23);

					button_10.__click = cancelEdit;

					var button_11 = sibling(button_10, 2);

					button_11.__click = savePrompt;

					var text_9 = child(button_11, true);

					reset(button_11);
					reset(div_23);
					reset(div_14);
					template_effect(() => set_text(text_9, get(editingPrompt) ? 'Save Changes' : 'Create Prompt'));
					bind_value(input_4, () => get(formTitle), ($$value) => set(formTitle, $$value));
					bind_select_value(select_1, () => get(formCategory), ($$value) => set(formCategory, $$value));
					bind_value(input_5, () => get(formTags), ($$value) => set(formTags, $$value));
					bind_value(textarea, () => get(formTemplate), ($$value) => set(formTemplate, $$value));
					append($$anchor, div_14);
				};

				var alternate_1 = ($$anchor) => {
					var div_24 = root_14();
					var node_8 = child(div_24);

					{
						var consequent_7 = ($$anchor) => {
							var div_25 = root_15();
							var node_9 = sibling(child(div_25), 2);

							each(node_9, 17, () => get(formVariables), (variable) => variable.name, ($$anchor, variable) => {
								var div_26 = root_16();
								var label_3 = child(div_26);
								var text_10 = child(label_3);
								var node_10 = sibling(text_10);

								{
									var consequent_6 = ($$anchor) => {
										var span_3 = root_17();
										var text_11 = child(span_3, true);

										reset(span_3);
										template_effect(() => set_text(text_11, get(variable).description));
										append($$anchor, span_3);
									};

									if_block(node_10, ($$render) => {
										if (get(variable).description) $$render(consequent_6);
									});
								}

								reset(label_3);

								var input_8 = sibling(label_3, 2);

								remove_input_defaults(input_8);
								input_8.__input = (e) => updateVariableValue(get(variable).name, e.target.value);
								reset(div_26);

								template_effect(() => {
									set_attribute(label_3, 'for', `var-${get(variable).name}`);
									set_text(text_10, `${get(variable).name ?? ''} `);
									set_attribute(input_8, 'id', `var-${get(variable).name}`);
									set_attribute(input_8, 'placeholder', get(variable).defaultValue || `Enter ${get(variable).name}...`);
									set_value(input_8, get(previewVariables)[get(variable).name] || '');
								});

								append($$anchor, div_26);
							});

							reset(div_25);
							append($$anchor, div_25);
						};

						if_block(node_8, ($$render) => {
							if (get(formVariables).length > 0) $$render(consequent_7);
						});
					}

					var div_27 = sibling(node_8, 2);
					var div_28 = child(div_27);
					var button_12 = sibling(child(div_28), 2);

					button_12.__click = () => copyToClipboard(get(previewText));
					reset(div_28);

					var pre = sibling(div_28, 2);
					var text_12 = child(pre, true);

					reset(pre);
					reset(div_27);
					reset(div_24);
					template_effect(() => set_text(text_12, get(previewText)));
					append($$anchor, div_24);
				};

				if_block(node_5, ($$render) => {
					if (get(activeTab) === 'edit') $$render(consequent_5); else $$render(alternate_1, false);
				});
			}

			reset(div_12);

			template_effect(() => {
				classes_1 = set_class(button_8, 1, 'tab svelte-10fangs', null, classes_1, { active: get(activeTab) === 'edit' });
				classes_2 = set_class(button_9, 1, 'tab svelte-10fangs', null, classes_2, { active: get(activeTab) === 'preview' });
			});

			append($$anchor, div_12);
		};

		if_block(node, ($$render) => {
			if (get(activeTab) === 'list') $$render(consequent_3); else $$render(alternate_2, false);
		});
	}

	reset(div);
	append($$anchor, div);
	pop();
}

delegate(['click', 'change', 'input']);

export { PromptManager as default };
