// ../../../../nix/store/8cl58ip2nasg6rdyj59cwg2f0qbixs28-astal-gjs/share/astal/gjs/gtk4/index.ts
import Astal6 from "gi://Astal?version=4.0";
import Gtk4 from "gi://Gtk?version=4.0";
import Gdk2 from "gi://Gdk?version=4.0";

// ../../../../nix/store/8cl58ip2nasg6rdyj59cwg2f0qbixs28-astal-gjs/share/astal/gjs/variable.ts
import Astal3 from "gi://AstalIO";

// ../../../../nix/store/8cl58ip2nasg6rdyj59cwg2f0qbixs28-astal-gjs/share/astal/gjs/binding.ts
var snakeify = (str) => str.replace(/([a-z])([A-Z])/g, "$1_$2").replaceAll("-", "_").toLowerCase();
var kebabify = (str) => str.replace(/([a-z])([A-Z])/g, "$1-$2").replaceAll("_", "-").toLowerCase();
var Binding = class _Binding {
  transformFn = (v) => v;
  #emitter;
  #prop;
  static bind(emitter, prop) {
    return new _Binding(emitter, prop);
  }
  constructor(emitter, prop) {
    this.#emitter = emitter;
    this.#prop = prop && kebabify(prop);
  }
  toString() {
    return `Binding<${this.#emitter}${this.#prop ? `, "${this.#prop}"` : ""}>`;
  }
  as(fn) {
    const bind2 = new _Binding(this.#emitter, this.#prop);
    bind2.transformFn = (v) => fn(this.transformFn(v));
    return bind2;
  }
  get() {
    if (typeof this.#emitter.get === "function")
      return this.transformFn(this.#emitter.get());
    if (typeof this.#prop === "string") {
      const getter = `get_${snakeify(this.#prop)}`;
      if (typeof this.#emitter[getter] === "function")
        return this.transformFn(this.#emitter[getter]());
      return this.transformFn(this.#emitter[this.#prop]);
    }
    throw Error("can not get value of binding");
  }
  subscribe(callback) {
    if (typeof this.#emitter.subscribe === "function") {
      return this.#emitter.subscribe(() => {
        callback(this.get());
      });
    } else if (typeof this.#emitter.connect === "function") {
      const signal = `notify::${this.#prop}`;
      const id = this.#emitter.connect(signal, () => {
        callback(this.get());
      });
      return () => {
        this.#emitter.disconnect(id);
      };
    }
    throw Error(`${this.#emitter} is not bindable`);
  }
};
var { bind } = Binding;
var binding_default = Binding;

// ../../../../nix/store/8cl58ip2nasg6rdyj59cwg2f0qbixs28-astal-gjs/share/astal/gjs/time.ts
import Astal from "gi://AstalIO";
var Time = Astal.Time;
function interval(interval2, callback) {
  return Astal.Time.interval(interval2, () => void callback?.());
}

// ../../../../nix/store/8cl58ip2nasg6rdyj59cwg2f0qbixs28-astal-gjs/share/astal/gjs/process.ts
import Astal2 from "gi://AstalIO";
var Process = Astal2.Process;
function subprocess(argsOrCmd, onOut = print, onErr = printerr) {
  const args = Array.isArray(argsOrCmd) || typeof argsOrCmd === "string";
  const { cmd, err, out } = {
    cmd: args ? argsOrCmd : argsOrCmd.cmd,
    err: args ? onErr : argsOrCmd.err || onErr,
    out: args ? onOut : argsOrCmd.out || onOut
  };
  const proc = Array.isArray(cmd) ? Astal2.Process.subprocessv(cmd) : Astal2.Process.subprocess(cmd);
  proc.connect("stdout", (_, stdout) => out(stdout));
  proc.connect("stderr", (_, stderr) => err(stderr));
  return proc;
}
function exec(cmd) {
  return Array.isArray(cmd) ? Astal2.Process.execv(cmd) : Astal2.Process.exec(cmd);
}
function execAsync(cmd) {
  return new Promise((resolve, reject) => {
    if (Array.isArray(cmd)) {
      Astal2.Process.exec_asyncv(cmd, (_, res) => {
        try {
          resolve(Astal2.Process.exec_asyncv_finish(res));
        } catch (error) {
          reject(error);
        }
      });
    } else {
      Astal2.Process.exec_async(cmd, (_, res) => {
        try {
          resolve(Astal2.Process.exec_finish(res));
        } catch (error) {
          reject(error);
        }
      });
    }
  });
}

// ../../../../nix/store/8cl58ip2nasg6rdyj59cwg2f0qbixs28-astal-gjs/share/astal/gjs/variable.ts
var VariableWrapper = class extends Function {
  variable;
  errHandler = console.error;
  _value;
  _poll;
  _watch;
  pollInterval = 1e3;
  pollExec;
  pollTransform;
  pollFn;
  watchTransform;
  watchExec;
  constructor(init) {
    super();
    this._value = init;
    this.variable = new Astal3.VariableBase();
    this.variable.connect("dropped", () => {
      this.stopWatch();
      this.stopPoll();
    });
    this.variable.connect("error", (_, err) => this.errHandler?.(err));
    return new Proxy(this, {
      apply: (target, _, args) => target._call(args[0])
    });
  }
  _call(transform) {
    const b = binding_default.bind(this);
    return transform ? b.as(transform) : b;
  }
  toString() {
    return String(`Variable<${this.get()}>`);
  }
  get() {
    return this._value;
  }
  set(value) {
    if (value !== this._value) {
      this._value = value;
      this.variable.emit("changed");
    }
  }
  startPoll() {
    if (this._poll)
      return;
    if (this.pollFn) {
      this._poll = interval(this.pollInterval, () => {
        const v = this.pollFn(this.get());
        if (v instanceof Promise) {
          v.then((v2) => this.set(v2)).catch((err) => this.variable.emit("error", err));
        } else {
          this.set(v);
        }
      });
    } else if (this.pollExec) {
      this._poll = interval(this.pollInterval, () => {
        execAsync(this.pollExec).then((v) => this.set(this.pollTransform(v, this.get()))).catch((err) => this.variable.emit("error", err));
      });
    }
  }
  startWatch() {
    if (this._watch)
      return;
    this._watch = subprocess({
      cmd: this.watchExec,
      out: (out) => this.set(this.watchTransform(out, this.get())),
      err: (err) => this.variable.emit("error", err)
    });
  }
  stopPoll() {
    this._poll?.cancel();
    delete this._poll;
  }
  stopWatch() {
    this._watch?.kill();
    delete this._watch;
  }
  isPolling() {
    return !!this._poll;
  }
  isWatching() {
    return !!this._watch;
  }
  drop() {
    this.variable.emit("dropped");
  }
  onDropped(callback) {
    this.variable.connect("dropped", callback);
    return this;
  }
  onError(callback) {
    delete this.errHandler;
    this.variable.connect("error", (_, err) => callback(err));
    return this;
  }
  subscribe(callback) {
    const id = this.variable.connect("changed", () => {
      callback(this.get());
    });
    return () => this.variable.disconnect(id);
  }
  poll(interval2, exec3, transform = (out) => out) {
    this.stopPoll();
    this.pollInterval = interval2;
    this.pollTransform = transform;
    if (typeof exec3 === "function") {
      this.pollFn = exec3;
      delete this.pollExec;
    } else {
      this.pollExec = exec3;
      delete this.pollFn;
    }
    this.startPoll();
    return this;
  }
  watch(exec3, transform = (out) => out) {
    this.stopWatch();
    this.watchExec = exec3;
    this.watchTransform = transform;
    this.startWatch();
    return this;
  }
  observe(objs, sigOrFn, callback) {
    const f = typeof sigOrFn === "function" ? sigOrFn : callback ?? (() => this.get());
    const set = (obj, ...args) => this.set(f(obj, ...args));
    if (Array.isArray(objs)) {
      for (const obj of objs) {
        const [o, s] = obj;
        const id = o.connect(s, set);
        this.onDropped(() => o.disconnect(id));
      }
    } else {
      if (typeof sigOrFn === "string") {
        const id = objs.connect(sigOrFn, set);
        this.onDropped(() => objs.disconnect(id));
      }
    }
    return this;
  }
  static derive(deps, fn = (...args) => args) {
    const update = () => fn(...deps.map((d) => d.get()));
    const derived = new Variable(update());
    const unsubs = deps.map((dep) => dep.subscribe(() => derived.set(update())));
    derived.onDropped(() => unsubs.map((unsub) => unsub()));
    return derived;
  }
};
var Variable = new Proxy(VariableWrapper, {
  apply: (_t, _a, args) => new VariableWrapper(args[0])
});
var { derive } = Variable;
var variable_default = Variable;

// ../../../../nix/store/8cl58ip2nasg6rdyj59cwg2f0qbixs28-astal-gjs/share/astal/gjs/_astal.ts
var noImplicitDestroy = Symbol("no no implicit destroy");
var setChildren = Symbol("children setter method");
function mergeBindings(array) {
  function getValues(...args) {
    let i = 0;
    return array.map(
      (value) => value instanceof binding_default ? args[i++] : value
    );
  }
  const bindings = array.filter((i) => i instanceof binding_default);
  if (bindings.length === 0)
    return array;
  if (bindings.length === 1)
    return bindings[0].as(getValues);
  return variable_default.derive(bindings, getValues)();
}
function setProp(obj, prop, value) {
  try {
    const setter = `set_${snakeify(prop)}`;
    if (typeof obj[setter] === "function")
      return obj[setter](value);
    return obj[prop] = value;
  } catch (error) {
    console.error(`could not set property "${prop}" on ${obj}:`, error);
  }
}
function construct(widget, config) {
  let { setup, child, children = [], ...props } = config;
  if (children instanceof binding_default) {
    children = [children];
  }
  if (child) {
    children.unshift(child);
  }
  for (const [key, value] of Object.entries(props)) {
    if (value === void 0) {
      delete props[key];
    }
  }
  const bindings = Object.keys(props).reduce((acc, prop) => {
    if (props[prop] instanceof binding_default) {
      const binding = props[prop];
      delete props[prop];
      return [...acc, [prop, binding]];
    }
    return acc;
  }, []);
  const onHandlers = Object.keys(props).reduce((acc, key) => {
    if (key.startsWith("on")) {
      const sig = kebabify(key).split("-").slice(1).join("-");
      const handler = props[key];
      delete props[key];
      return [...acc, [sig, handler]];
    }
    return acc;
  }, []);
  const mergedChildren = mergeBindings(children.flat(Infinity));
  if (mergedChildren instanceof binding_default) {
    widget[setChildren](mergedChildren.get());
    widget.connect("destroy", mergedChildren.subscribe((v) => {
      widget[setChildren](v);
    }));
  } else {
    if (mergedChildren.length > 0) {
      widget[setChildren](mergedChildren);
    }
  }
  for (const [signal, callback] of onHandlers) {
    const sig = signal.startsWith("notify") ? signal.replace("-", "::") : signal;
    if (typeof callback === "function") {
      widget.connect(sig, callback);
    } else {
      widget.connect(sig, () => execAsync(callback).then(print).catch(console.error));
    }
  }
  for (const [prop, binding] of bindings) {
    if (prop === "child" || prop === "children") {
      widget.connect("destroy", binding.subscribe((v) => {
        widget[setChildren](v);
      }));
    }
    widget.connect("destroy", binding.subscribe((v) => {
      setProp(widget, prop, v);
    }));
    setProp(widget, prop, binding.get());
  }
  for (const [key, value] of Object.entries(props)) {
    if (value === void 0) {
      delete props[key];
    }
  }
  Object.assign(widget, props);
  setup?.(widget);
  return widget;
}
function isArrowFunction(func) {
  return !Object.hasOwn(func, "prototype");
}
function jsx(ctors2, ctor, { children, ...props }) {
  children ??= [];
  if (!Array.isArray(children))
    children = [children];
  children = children.filter(Boolean);
  if (children.length === 1)
    props.child = children[0];
  else if (children.length > 1)
    props.children = children;
  if (typeof ctor === "string") {
    if (isArrowFunction(ctors2[ctor]))
      return ctors2[ctor](props);
    return new ctors2[ctor](props);
  }
  if (isArrowFunction(ctor))
    return ctor(props);
  return new ctor(props);
}

// ../../../../nix/store/8cl58ip2nasg6rdyj59cwg2f0qbixs28-astal-gjs/share/astal/gjs/gtk4/astalify.ts
import Gtk from "gi://Gtk?version=4.0";
import Gdk from "gi://Gdk?version=4.0";
var type = Symbol("child type");
var dummyBulder = new Gtk.Builder();
function _getChildren(widget) {
  if ("get_child" in widget && typeof widget.get_child == "function") {
    return widget.get_child() ? [widget.get_child()] : [];
  }
  const children = [];
  let ch = widget.get_first_child();
  while (ch !== null) {
    children.push(ch);
    ch = ch.get_next_sibling();
  }
  return children;
}
function _setChildren(widget, children) {
  children = children.flat(Infinity).map((ch) => ch instanceof Gtk.Widget ? ch : new Gtk.Label({ visible: true, label: String(ch) }));
  for (const child of children) {
    widget.vfunc_add_child(
      dummyBulder,
      child,
      type in child ? child[type] : null
    );
  }
}
function astalify(cls, config = {}) {
  Object.assign(cls.prototype, {
    [setChildren](children) {
      const w = this;
      for (const child of config.getChildren?.(w) || _getChildren(w)) {
        if (child instanceof Gtk.Widget) {
          child.unparent();
          if (!children.includes(child) && noImplicitDestroy in this)
            child.run_dispose();
        }
      }
      if (config.setChildren) {
        config.setChildren(w, children);
      } else {
        _setChildren(w, children);
      }
    }
  });
  return {
    [cls.name]: (props = {}, ...children) => {
      const widget = new cls("cssName" in props ? { cssName: props.cssName } : {});
      if ("cssName" in props) {
        delete props.cssName;
      }
      if (props.noImplicitDestroy) {
        Object.assign(widget, { [noImplicitDestroy]: true });
        delete props.noImplicitDestroy;
      }
      if (props.type) {
        Object.assign(widget, { [type]: props.type });
        delete props.type;
      }
      if (children.length > 0) {
        Object.assign(props, { children });
      }
      return construct(widget, setupControllers(widget, props));
    }
  }[cls.name];
}
function setupControllers(widget, {
  onFocusEnter,
  onFocusLeave,
  onKeyPressed,
  onKeyReleased,
  onKeyModifier,
  onLegacy,
  onButtonPressed,
  onButtonReleased,
  onHoverEnter,
  onHoverLeave,
  onMotion,
  onScroll,
  onScrollDecelerate,
  ...props
}) {
  if (onFocusEnter || onFocusLeave) {
    const focus = new Gtk.EventControllerFocus();
    widget.add_controller(focus);
    if (onFocusEnter)
      focus.connect("enter", () => onFocusEnter(widget));
    if (onFocusLeave)
      focus.connect("leave", () => onFocusLeave(widget));
  }
  if (onKeyPressed || onKeyReleased || onKeyModifier) {
    const key = new Gtk.EventControllerKey();
    widget.add_controller(key);
    if (onKeyPressed)
      key.connect("key-pressed", (_, val, code, state) => onKeyPressed(widget, val, code, state));
    if (onKeyReleased)
      key.connect("key-released", (_, val, code, state) => onKeyReleased(widget, val, code, state));
    if (onKeyModifier)
      key.connect("modifiers", (_, state) => onKeyModifier(widget, state));
  }
  if (onLegacy || onButtonPressed || onButtonReleased) {
    const legacy = new Gtk.EventControllerLegacy();
    widget.add_controller(legacy);
    legacy.connect("event", (_, event) => {
      if (event.get_event_type() === Gdk.EventType.BUTTON_PRESS) {
        onButtonPressed?.(widget, event);
      }
      if (event.get_event_type() === Gdk.EventType.BUTTON_RELEASE) {
        onButtonReleased?.(widget, event);
      }
      onLegacy?.(widget, event);
    });
  }
  if (onMotion || onHoverEnter || onHoverLeave) {
    const hover = new Gtk.EventControllerMotion();
    widget.add_controller(hover);
    if (onHoverEnter)
      hover.connect("enter", (_, x, y) => onHoverEnter(widget, x, y));
    if (onHoverLeave)
      hover.connect("leave", () => onHoverLeave(widget));
    if (onMotion)
      hover.connect("motion", (_, x, y) => onMotion(widget, x, y));
  }
  if (onScroll || onScrollDecelerate) {
    const scroll = new Gtk.EventControllerScroll();
    scroll.flags = Gtk.EventControllerScrollFlags.BOTH_AXES | Gtk.EventControllerScrollFlags.KINETIC;
    widget.add_controller(scroll);
    if (onScroll)
      scroll.connect("scroll", (_, x, y) => onScroll(widget, x, y));
    if (onScrollDecelerate)
      scroll.connect("decelerate", (_, x, y) => onScrollDecelerate(widget, x, y));
  }
  return props;
}

// ../../../../nix/store/8cl58ip2nasg6rdyj59cwg2f0qbixs28-astal-gjs/share/astal/gjs/gtk4/app.ts
import GLib from "gi://GLib?version=2.0";
import Gtk2 from "gi://Gtk?version=4.0";
import Astal4 from "gi://Astal?version=4.0";

// ../../../../nix/store/8cl58ip2nasg6rdyj59cwg2f0qbixs28-astal-gjs/share/astal/gjs/overrides.ts
var snakeify2 = (str) => str.replace(/([a-z])([A-Z])/g, "$1_$2").replaceAll("-", "_").toLowerCase();
async function suppress(mod, patch2) {
  return mod.then((m) => patch2(m.default)).catch(() => void 0);
}
function patch(proto, prop) {
  Object.defineProperty(proto, prop, {
    get() {
      return this[`get_${snakeify2(prop)}`]();
    }
  });
}
await suppress(import("gi://AstalApps"), ({ Apps, Application }) => {
  patch(Apps.prototype, "list");
  patch(Application.prototype, "keywords");
  patch(Application.prototype, "categories");
});
await suppress(import("gi://AstalBattery"), ({ UPower }) => {
  patch(UPower.prototype, "devices");
});
await suppress(import("gi://AstalBluetooth"), ({ Adapter, Bluetooth, Device }) => {
  patch(Adapter.prototype, "uuids");
  patch(Bluetooth.prototype, "adapters");
  patch(Bluetooth.prototype, "devices");
  patch(Device.prototype, "uuids");
});
await suppress(import("gi://AstalHyprland"), ({ Hyprland: Hyprland2, Monitor, Workspace }) => {
  patch(Hyprland2.prototype, "binds");
  patch(Hyprland2.prototype, "monitors");
  patch(Hyprland2.prototype, "workspaces");
  patch(Hyprland2.prototype, "clients");
  patch(Monitor.prototype, "availableModes");
  patch(Monitor.prototype, "available_modes");
  patch(Workspace.prototype, "clients");
});
await suppress(import("gi://AstalMpris"), ({ Mpris, Player }) => {
  patch(Mpris.prototype, "players");
  patch(Player.prototype, "supported_uri_schemes");
  patch(Player.prototype, "supportedUriSchemes");
  patch(Player.prototype, "supported_mime_types");
  patch(Player.prototype, "supportedMimeTypes");
  patch(Player.prototype, "comments");
});
await suppress(import("gi://AstalNetwork"), ({ Wifi }) => {
  patch(Wifi.prototype, "access_points");
  patch(Wifi.prototype, "accessPoints");
});
await suppress(import("gi://AstalNotifd"), ({ Notifd, Notification }) => {
  patch(Notifd.prototype, "notifications");
  patch(Notification.prototype, "actions");
});
await suppress(import("gi://AstalPowerProfiles"), ({ PowerProfiles }) => {
  patch(PowerProfiles.prototype, "actions");
});
await suppress(import("gi://AstalWp"), ({ Wp: Wp2, Audio, Video }) => {
  patch(Wp2.prototype, "endpoints");
  patch(Wp2.prototype, "devices");
  patch(Audio.prototype, "streams");
  patch(Audio.prototype, "recorders");
  patch(Audio.prototype, "microphones");
  patch(Audio.prototype, "speakers");
  patch(Audio.prototype, "devices");
  patch(Video.prototype, "streams");
  patch(Video.prototype, "recorders");
  patch(Video.prototype, "sinks");
  patch(Video.prototype, "sources");
  patch(Video.prototype, "devices");
});

// ../../../../nix/store/8cl58ip2nasg6rdyj59cwg2f0qbixs28-astal-gjs/share/astal/gjs/_app.ts
import { setConsoleLogDomain } from "console";
import { exit, programArgs } from "system";
import IO from "gi://AstalIO";
import GObject from "gi://GObject";
function mkApp(App2) {
  return new class AstalJS extends App2 {
    static {
      GObject.registerClass({ GTypeName: "AstalJS" }, this);
    }
    eval(body) {
      return new Promise((res, rej) => {
        try {
          const fn = Function(`return (async function() {
                        ${body.includes(";") ? body : `return ${body};`}
                    })`);
          fn()().then(res).catch(rej);
        } catch (error) {
          rej(error);
        }
      });
    }
    requestHandler;
    vfunc_request(msg, conn) {
      if (typeof this.requestHandler === "function") {
        this.requestHandler(msg, (response) => {
          IO.write_sock(
            conn,
            String(response),
            (_, res) => IO.write_sock_finish(res)
          );
        });
      } else {
        super.vfunc_request(msg, conn);
      }
    }
    apply_css(style, reset = false) {
      super.apply_css(style, reset);
    }
    quit(code) {
      super.quit();
      exit(code ?? 0);
    }
    start({ requestHandler, css, hold, main, client, icons, ...cfg } = {}) {
      const app = this;
      client ??= () => {
        print(`Astal instance "${app.instanceName}" already running`);
        exit(1);
      };
      Object.assign(this, cfg);
      setConsoleLogDomain(app.instanceName);
      this.requestHandler = requestHandler;
      app.connect("activate", () => {
        main?.(...programArgs);
      });
      try {
        app.acquire_socket();
      } catch (error) {
        return client((msg) => IO.send_request(app.instanceName, msg), ...programArgs);
      }
      if (css)
        this.apply_css(css, false);
      if (icons)
        app.add_icons(icons);
      hold ??= true;
      if (hold)
        app.hold();
      app.runAsync([]);
    }
  }();
}

// ../../../../nix/store/8cl58ip2nasg6rdyj59cwg2f0qbixs28-astal-gjs/share/astal/gjs/gtk4/app.ts
Gtk2.init();
GLib.unsetenv("LD_PRELOAD");
await import("gi://Adw?version=1").then(({ default: Adw }) => Adw.init()).catch(() => void 0);
var app_default = mkApp(Astal4.Application);

// ../../../../nix/store/8cl58ip2nasg6rdyj59cwg2f0qbixs28-astal-gjs/share/astal/gjs/gtk4/widget.ts
import Astal5 from "gi://Astal?version=4.0";
import Gtk3 from "gi://Gtk?version=4.0";
function filter(children) {
  return children.flat(Infinity).map((ch) => ch instanceof Gtk3.Widget ? ch : new Gtk3.Label({ visible: true, label: String(ch) }));
}
Object.defineProperty(Astal5.Box.prototype, "children", {
  get() {
    return this.get_children();
  },
  set(v) {
    this.set_children(v);
  }
});
var Box = astalify(Astal5.Box, {
  getChildren(self) {
    return self.get_children();
  },
  setChildren(self, children) {
    return self.set_children(filter(children));
  }
});
var Button = astalify(Gtk3.Button);
var CenterBox = astalify(Gtk3.CenterBox, {
  getChildren(box) {
    return [box.startWidget, box.centerWidget, box.endWidget];
  },
  setChildren(box, children) {
    const ch = filter(children);
    box.startWidget = ch[0] || new Gtk3.Box();
    box.centerWidget = ch[1] || new Gtk3.Box();
    box.endWidget = ch[2] || new Gtk3.Box();
  }
});
var Entry = astalify(Gtk3.Entry, {
  getChildren() {
    return [];
  }
});
var Image = astalify(Gtk3.Image, {
  getChildren() {
    return [];
  }
});
var Label = astalify(Gtk3.Label, {
  getChildren() {
    return [];
  },
  setChildren(self, children) {
    self.label = String(children);
  }
});
var LevelBar = astalify(Gtk3.LevelBar, {
  getChildren() {
    return [];
  }
});
var Overlay = astalify(Gtk3.Overlay, {
  getChildren(self) {
    const children = [];
    let ch = self.get_first_child();
    while (ch !== null) {
      children.push(ch);
      ch = ch.get_next_sibling();
    }
    return children.filter((ch2) => ch2 !== self.child);
  },
  setChildren(self, children) {
    for (const child of filter(children)) {
      const types = type in child ? child[type].split(/\s+/) : [];
      if (types.includes("overlay")) {
        self.add_overlay(child);
      } else {
        self.set_child(child);
      }
      self.set_measure_overlay(child, types.includes("measure"));
      self.set_clip_overlay(child, types.includes("clip"));
    }
  }
});
var Revealer = astalify(Gtk3.Revealer);
var Slider = astalify(Astal5.Slider, {
  getChildren() {
    return [];
  }
});
var Stack = astalify(Gtk3.Stack, {
  setChildren(self, children) {
    for (const child of filter(children)) {
      if (child.name != "" && child.name != null) {
        self.add_named(child, child.name);
      } else {
        self.add_child(child);
      }
    }
  }
});
var Switch = astalify(Gtk3.Switch, {
  getChildren() {
    return [];
  }
});
var Window = astalify(Astal5.Window);
var MenuButton = astalify(Gtk3.MenuButton, {
  getChildren(self) {
    return [self.popover, self.child];
  },
  setChildren(self, children) {
    for (const child of filter(children)) {
      if (child instanceof Gtk3.Popover) {
        self.set_popover(child);
      } else {
        self.set_child(child);
      }
    }
  }
});
var Popover = astalify(Gtk3.Popover);

// sass:/etc/nixos/home/ags/style.scss
var style_default = 'window.Bar {\n  background: transparent;\n  color: #eceff4;\n  font-family: "JetBrainsMono Nerd Font Mono";\n  font-weight: normal;\n  font-size: 14px;\n}\nwindow.Bar > centerbox {\n  background: transparent;\n  border-radius: 0;\n  margin: 0;\n  padding: 4px 12px;\n  border: none;\n}\nwindow.Bar .left {\n  margin-right: 12px;\n}\nwindow.Bar .right {\n  margin-left: 12px;\n}\nwindow.Bar .workspaces {\n  background: #3b4252;\n  border-radius: 6px;\n  padding: 1px;\n  border: none;\n}\nwindow.Bar .workspaces .workspace {\n  background: transparent;\n  border: none;\n  border-radius: 0;\n  padding: 4px 8px;\n  margin: 0;\n  min-width: 24px;\n  color: #d8dee9;\n  transition: all 200ms ease;\n  font-weight: normal;\n  font-size: 14px;\n}\nwindow.Bar .workspaces .workspace:only-child {\n  border-radius: 5px;\n}\nwindow.Bar .workspaces .workspace:hover {\n  background: rgba(216, 222, 233, 0.15);\n  color: #eceff4;\n}\nwindow.Bar .workspaces .workspace.active {\n  background: #5e81ac;\n  color: #eceff4;\n}\nwindow.Bar .active-window {\n  padding: 4px 8px;\n  border-radius: 6px;\n  background: #434c5e;\n  border: none;\n  min-width: 120px;\n}\nwindow.Bar .active-window label {\n  color: #e5e9f0;\n  font-style: italic;\n}\nwindow.Bar .clock {\n  color: #eceff4;\n  padding: 4px 8px;\n  border-radius: 6px;\n  background: #434c5e;\n  border: none;\n}\nwindow.Bar .system-info .cpu, window.Bar .system-info .memory {\n  padding: 4px 6px;\n  border-radius: 4px;\n  background: #434c5e;\n}\nwindow.Bar .system-info .cpu label:first-child, window.Bar .system-info .memory label:first-child {\n  color: #d8dee9;\n}\nwindow.Bar .system-info .cpu label:last-child, window.Bar .system-info .memory label:last-child {\n  color: #eceff4;\n}\nwindow.Bar .system-info .cpu {\n  background: #434c5e;\n  border: none;\n}\nwindow.Bar .system-info .cpu label:last-child {\n  color: #a3be8c;\n}\nwindow.Bar .system-info .memory {\n  background: #434c5e;\n  border: none;\n}\nwindow.Bar .system-info .memory label:last-child {\n  color: #ebcb8b;\n}\nwindow.Bar .system-info .audio {\n  padding: 4px 8px;\n  border-radius: 6px;\n  background: #434c5e;\n  border: none;\n  transition: all 200ms ease;\n}\nwindow.Bar .system-info .audio:hover {\n  background: #4c566a;\n  border-color: #88c0d0;\n}\nwindow.Bar .system-info .audio box label:first-child {\n  color: #d8dee9;\n}\nwindow.Bar .system-info .audio box label:last-child {\n  color: #b48ead;\n  font-weight: bold;\n}\nwindow.Bar button {\n  border-radius: 2px;\n  margin: 0;\n  border: none;\n  background: transparent;\n  transition: all 200ms ease;\n  outline: none;\n  box-shadow: none;\n}\nwindow.Bar button:not(:focus) {\n  color: #4c566a;\n}\nwindow.Bar button:focus {\n  outline: none;\n  box-shadow: none;\n}\nwindow.Bar button:hover {\n  outline: none;\n}\nwindow.Bar button:active {\n  outline: none;\n  box-shadow: none;\n}\n\nwindow.Wallpaper {\n  background: #2e3440;\n}';

// ../../../../nix/store/8cl58ip2nasg6rdyj59cwg2f0qbixs28-astal-gjs/share/astal/gjs/index.ts
import { default as default3 } from "gi://AstalIO?version=0.1";

// ../../../../nix/store/8cl58ip2nasg6rdyj59cwg2f0qbixs28-astal-gjs/share/astal/gjs/file.ts
import Astal7 from "gi://AstalIO";
import Gio from "gi://Gio?version=2.0";

// ../../../../nix/store/8cl58ip2nasg6rdyj59cwg2f0qbixs28-astal-gjs/share/astal/gjs/gobject.ts
import GObject2 from "gi://GObject";
import { default as default2 } from "gi://GLib?version=2.0";
var meta = Symbol("meta");
var priv = Symbol("priv");
var { ParamSpec, ParamFlags } = GObject2;

// widget/Bar.tsx
import Hyprland from "gi://AstalHyprland";
import Wp from "gi://AstalWp";

// ../../../../nix/store/8cl58ip2nasg6rdyj59cwg2f0qbixs28-astal-gjs/share/astal/gjs/gtk4/jsx-runtime.ts
function jsx2(ctor, props) {
  return jsx(ctors, ctor, props);
}
var ctors = {
  box: Box,
  button: Button,
  centerbox: CenterBox,
  // circularprogress: Widget.CircularProgress,
  // drawingarea: Widget.DrawingArea,
  entry: Entry,
  image: Image,
  label: Label,
  levelbar: LevelBar,
  overlay: Overlay,
  revealer: Revealer,
  slider: Slider,
  stack: Stack,
  switch: Switch,
  window: Window,
  menubutton: MenuButton,
  popover: Popover
};
var jsxs = jsx2;

// widget/Bar.tsx
var hyprland = Hyprland.get_default();
var audio = Wp.get_default();
var time = Variable("").poll(60 * 1e3, () => {
  const now = /* @__PURE__ */ new Date();
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = days[now.getDay()];
  const month = months[now.getMonth()];
  const date = now.getDate();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  return `${day} ${month} ${date} ${hours}:${minutes}`;
});
var activeWorkspace = Variable(hyprland.get_focused_workspace()?.get_id() || 1);
function updateActiveWorkspace() {
  const workspace = hyprland.get_focused_workspace();
  if (workspace) {
    activeWorkspace.set(workspace.get_id());
  }
}
var workspacesWithWindows = Variable([]);
function updateWorkspaces() {
  const workspaces = hyprland.get_workspaces();
  const activeWs = hyprland.get_focused_workspace()?.get_id() || 1;
  const workspacesWithWins = workspaces.filter((ws) => ws.get_clients().length > 0).map((ws) => ws.get_id());
  const allWorkspaces = [.../* @__PURE__ */ new Set([...workspacesWithWins, activeWs])];
  workspacesWithWindows.set(allWorkspaces.sort((a, b) => a - b));
}
var activeWindow = Variable("");
function updateActiveWindow() {
  const client = hyprland.get_focused_client();
  if (client && client.get_title()) {
    activeWindow.set(client.get_title());
  } else {
    const workspace = hyprland.get_focused_workspace();
    activeWindow.set(`Workspace ${workspace?.get_id() || 1}`);
  }
}
updateActiveWorkspace();
updateActiveWindow();
updateWorkspaces();
hyprland.connect("event", (_, event, data) => {
  if (event === "workspace") {
    const workspaceId = parseInt(data);
    if (!isNaN(workspaceId)) {
      activeWorkspace.set(workspaceId);
    }
    retryUpdate(() => {
      updateWorkspaces();
      updateActiveWindow();
    });
  } else if (event === "focusedmon" || event === "activewindow") {
    retryUpdate(() => {
      updateActiveWorkspace();
      updateActiveWindow();
      updateWorkspaces();
    });
  }
});
function retryUpdate(updateFn, maxRetries = 3, delay = 5) {
  let retries = 0;
  function attempt() {
    try {
      const prevActiveWs = activeWorkspace.get();
      updateFn();
      if (retries < maxRetries) {
        setTimeout(() => {
          const newActiveWs = activeWorkspace.get();
          if (prevActiveWs === newActiveWs && retries < maxRetries - 1) {
            retries++;
            setTimeout(attempt, delay * Math.pow(2, retries));
          }
        }, delay);
      }
    } catch (error) {
      if (retries < maxRetries) {
        retries++;
        setTimeout(attempt, delay * Math.pow(2, retries));
      }
    }
  }
  attempt();
}
var cpuUsage = Variable("0%").poll(1e3, () => {
  try {
    const output = exec("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1");
    return `${Math.round(parseFloat(output))}%`;
  } catch {
    return "ERR%";
  }
});
var memoryUsage = Variable("0%").poll(1e3, () => {
  try {
    const output = exec(`free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}'`);
    return `${output}%`;
  } catch {
    return "ERR%";
  }
});
var audioVolume = Variable({ icon: "", volume: "0%" }).poll(100, () => {
  try {
    let output = parseFloat(audio.default_speaker.volume);
    output = Math.round(output * 100);
    let icon = "\uEEE8";
    if (output === 0) {
      icon = "\uEEE8";
    } else if (output <= 33) {
      icon = "\uF026";
    } else if (output <= 66) {
      icon = "\uF027";
    } else {
      icon = "\uF028";
    }
    return { icon, volume: `${output}%` };
  } catch {
    return { icon: "", volume: "ERR%" };
  }
});
function Bar(gdkmonitor) {
  const { TOP, LEFT, RIGHT } = Astal6.WindowAnchor;
  return /* @__PURE__ */ jsx2(
    "window",
    {
      className: "Bar",
      gdkmonitor,
      exclusivity: Astal6.Exclusivity.EXCLUSIVE,
      anchor: TOP | LEFT | RIGHT,
      application: app_default,
      child: /* @__PURE__ */ jsx2(
        "centerbox",
        {
          startWidget: /* @__PURE__ */ jsxs("box", { halign: Gtk4.Align.START, spacing: 12, className: "left", children: [
            /* @__PURE__ */ jsx2(
              "box",
              {
                className: "workspaces",
                spacing: 0,
                children: bind(workspacesWithWindows).as(
                  (workspaces) => workspaces.map((id) => /* @__PURE__ */ jsx2(
                    "button",
                    {
                      className: bind(activeWorkspace).as((active) => active === id ? "workspace active" : "workspace"),
                      onClicked: () => hyprland.dispatch("workspace", id.toString()),
                      child: /* @__PURE__ */ jsx2("label", { label: id.toString() })
                    }
                  ))
                )
              }
            ),
            /* @__PURE__ */ jsx2(
              "label",
              {
                className: "active-window",
                label: bind(activeWindow)
              }
            )
          ] }),
          centerWidget: /* @__PURE__ */ jsx2(
            "label",
            {
              halign: Gtk4.Align.CENTER,
              className: "clock",
              label: bind(time)
            }
          ),
          endWidget: /* @__PURE__ */ jsxs("box", { halign: Gtk4.Align.END, spacing: 8, className: "right system-info", children: [
            /* @__PURE__ */ jsxs("box", { className: "cpu", children: [
              /* @__PURE__ */ jsx2("label", { label: "CPU " }),
              /* @__PURE__ */ jsx2("label", { label: bind(cpuUsage) })
            ] }),
            /* @__PURE__ */ jsxs("box", { className: "memory", children: [
              /* @__PURE__ */ jsx2("label", { label: "MEM " }),
              /* @__PURE__ */ jsx2("label", { label: bind(memoryUsage) })
            ] }),
            /* @__PURE__ */ jsx2(
              "button",
              {
                className: "audio",
                onClicked: () => execAsync("pavucontrol"),
                child: /* @__PURE__ */ jsxs("box", { children: [
                  /* @__PURE__ */ jsx2("label", { label: bind(audioVolume).as((audio2) => audio2.icon) }),
                  /* @__PURE__ */ jsx2("label", { label: bind(audioVolume).as((audio2) => ` ${audio2.volume}`) })
                ] })
              }
            )
          ] })
        }
      )
    }
  );
}

// widget/Wallpaper.tsx
var WeightedImageSampler = class {
  images = /* @__PURE__ */ new Map();
  totalSamples = 0;
  isLoaded = false;
  onLoadedCallbacks = [];
  constructor() {
    this.loadImages();
  }
  async loadImages() {
    try {
      const homeDir = await execAsync("sh -c 'echo $HOME'");
      const wallpaperDir = `${homeDir.trim()}/Pictures/Wallpapers`;
      try {
        await execAsync(`test -d "${wallpaperDir}"`);
      } catch {
        console.log(`Wallpaper directory ${wallpaperDir} does not exist`);
        return;
      }
      const output = await execAsync(`find "${wallpaperDir}" -maxdepth 1 -type f \\( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" -o -iname "*.bmp" -o -iname "*.tiff" \\)`);
      const imageFiles = output.trim().split("\n").filter((path) => path.length > 0);
      this.images.clear();
      for (const fullPath of imageFiles) {
        this.images.set(fullPath, {
          path: fullPath,
          sampleCount: 0,
          lastSampled: 0
        });
      }
      console.log(`Loaded ${this.images.size} wallpaper images`);
      this.isLoaded = true;
      this.onLoadedCallbacks.forEach((callback) => callback());
      this.onLoadedCallbacks = [];
    } catch (error) {
      console.error("Error loading wallpaper images:", error);
    }
  }
  onLoaded(callback) {
    if (this.isLoaded) {
      callback();
    } else {
      this.onLoadedCallbacks.push(callback);
    }
  }
  calculateWeight(image) {
    const baseWeight = 1 / (image.sampleCount + 1);
    const timeSinceLastSample = this.totalSamples - image.lastSampled;
    const timeWeight = Math.log(timeSinceLastSample + 1) + 1;
    return baseWeight * timeWeight;
  }
  // Efraimidis-Spirakis algorithm implementation
  sampleNext() {
    if (this.images.size === 0) return null;
    let maxKey = -Infinity;
    let selectedImage = null;
    for (const [path, image] of this.images) {
      const weight = this.calculateWeight(image);
      const key = Math.pow(Math.random(), 1 / weight);
      if (key > maxKey) {
        maxKey = key;
        selectedImage = image;
      }
    }
    if (selectedImage) {
      selectedImage.sampleCount++;
      selectedImage.lastSampled = this.totalSamples;
      this.totalSamples++;
      console.log(`Selected wallpaper: ${selectedImage.path} (sampled ${selectedImage.sampleCount} times)`);
      return selectedImage.path;
    }
    return null;
  }
  async refreshImages() {
    await this.loadImages();
  }
};
var imageSampler = new WeightedImageSampler();
var currentWallpaper = Variable("");
imageSampler.onLoaded(() => {
  const initialImage = imageSampler.sampleNext();
  if (initialImage) {
    currentWallpaper.set(initialImage);
    console.log(`Initial wallpaper set: ${initialImage}`);
  }
});
currentWallpaper.poll(60 * 1e3, async () => {
  const nextImage = imageSampler.sampleNext();
  return nextImage || currentWallpaper.get();
});
var imageRefresher = Variable("").poll(3e5, async () => {
  await imageSampler.refreshImages();
  return "";
});
function Wallpaper(gdkmonitor) {
  const { TOP, LEFT, RIGHT, BOTTOM } = Astal6.WindowAnchor;
  return /* @__PURE__ */ jsx2(
    "window",
    {
      className: "Wallpaper",
      gdkmonitor,
      exclusivity: Astal6.Exclusivity.IGNORE,
      anchor: TOP | LEFT | RIGHT | BOTTOM,
      layer: Astal6.Layer.BACKGROUND,
      keymode: Astal6.Keymode.NONE,
      child: /* @__PURE__ */ jsx2(
        "box",
        {
          className: "wallpaper-container",
          css: bind(currentWallpaper).as((path) => {
            if (!path) return "background: #2e3440;";
            return `
                        background-image: url('file://${path}');
                        background-size: cover;
                        background-position: center;
                        background-repeat: no-repeat;
                    `;
          })
        }
      )
    }
  );
}

// app.ts
app_default.start({
  css: style_default,
  main() {
    app_default.get_monitors().map(Bar);
    app_default.get_monitors().map(Wallpaper);
  }
});
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vbml4L3N0b3JlLzhjbDU4aXAybmFzZzZyZHlqNTljd2cyZjBxYml4czI4LWFzdGFsLWdqcy9zaGFyZS9hc3RhbC9nanMvZ3RrNC9pbmRleC50cyIsICIuLi8uLi8uLi8uLi9uaXgvc3RvcmUvOGNsNThpcDJuYXNnNnJkeWo1OWN3ZzJmMHFiaXhzMjgtYXN0YWwtZ2pzL3NoYXJlL2FzdGFsL2dqcy92YXJpYWJsZS50cyIsICIuLi8uLi8uLi8uLi9uaXgvc3RvcmUvOGNsNThpcDJuYXNnNnJkeWo1OWN3ZzJmMHFiaXhzMjgtYXN0YWwtZ2pzL3NoYXJlL2FzdGFsL2dqcy9iaW5kaW5nLnRzIiwgIi4uLy4uLy4uLy4uL25peC9zdG9yZS84Y2w1OGlwMm5hc2c2cmR5ajU5Y3dnMmYwcWJpeHMyOC1hc3RhbC1nanMvc2hhcmUvYXN0YWwvZ2pzL3RpbWUudHMiLCAiLi4vLi4vLi4vLi4vbml4L3N0b3JlLzhjbDU4aXAybmFzZzZyZHlqNTljd2cyZjBxYml4czI4LWFzdGFsLWdqcy9zaGFyZS9hc3RhbC9nanMvcHJvY2Vzcy50cyIsICIuLi8uLi8uLi8uLi9uaXgvc3RvcmUvOGNsNThpcDJuYXNnNnJkeWo1OWN3ZzJmMHFiaXhzMjgtYXN0YWwtZ2pzL3NoYXJlL2FzdGFsL2dqcy9fYXN0YWwudHMiLCAiLi4vLi4vLi4vLi4vbml4L3N0b3JlLzhjbDU4aXAybmFzZzZyZHlqNTljd2cyZjBxYml4czI4LWFzdGFsLWdqcy9zaGFyZS9hc3RhbC9nanMvZ3RrNC9hc3RhbGlmeS50cyIsICIuLi8uLi8uLi8uLi9uaXgvc3RvcmUvOGNsNThpcDJuYXNnNnJkeWo1OWN3ZzJmMHFiaXhzMjgtYXN0YWwtZ2pzL3NoYXJlL2FzdGFsL2dqcy9ndGs0L2FwcC50cyIsICIuLi8uLi8uLi8uLi9uaXgvc3RvcmUvOGNsNThpcDJuYXNnNnJkeWo1OWN3ZzJmMHFiaXhzMjgtYXN0YWwtZ2pzL3NoYXJlL2FzdGFsL2dqcy9vdmVycmlkZXMudHMiLCAiLi4vLi4vLi4vLi4vbml4L3N0b3JlLzhjbDU4aXAybmFzZzZyZHlqNTljd2cyZjBxYml4czI4LWFzdGFsLWdqcy9zaGFyZS9hc3RhbC9nanMvX2FwcC50cyIsICIuLi8uLi8uLi8uLi9uaXgvc3RvcmUvOGNsNThpcDJuYXNnNnJkeWo1OWN3ZzJmMHFiaXhzMjgtYXN0YWwtZ2pzL3NoYXJlL2FzdGFsL2dqcy9ndGs0L3dpZGdldC50cyIsICJzYXNzOi9ldGMvbml4b3MvaG9tZS9hZ3Mvc3R5bGUuc2NzcyIsICIuLi8uLi8uLi8uLi9uaXgvc3RvcmUvOGNsNThpcDJuYXNnNnJkeWo1OWN3ZzJmMHFiaXhzMjgtYXN0YWwtZ2pzL3NoYXJlL2FzdGFsL2dqcy9pbmRleC50cyIsICIuLi8uLi8uLi8uLi9uaXgvc3RvcmUvOGNsNThpcDJuYXNnNnJkeWo1OWN3ZzJmMHFiaXhzMjgtYXN0YWwtZ2pzL3NoYXJlL2FzdGFsL2dqcy9maWxlLnRzIiwgIi4uLy4uLy4uLy4uL25peC9zdG9yZS84Y2w1OGlwMm5hc2c2cmR5ajU5Y3dnMmYwcWJpeHMyOC1hc3RhbC1nanMvc2hhcmUvYXN0YWwvZ2pzL2dvYmplY3QudHMiLCAid2lkZ2V0L0Jhci50c3giLCAiLi4vLi4vLi4vLi4vbml4L3N0b3JlLzhjbDU4aXAybmFzZzZyZHlqNTljd2cyZjBxYml4czI4LWFzdGFsLWdqcy9zaGFyZS9hc3RhbC9nanMvZ3RrNC9qc3gtcnVudGltZS50cyIsICJ3aWRnZXQvV2FsbHBhcGVyLnRzeCIsICJhcHAudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCBBc3RhbCBmcm9tIFwiZ2k6Ly9Bc3RhbD92ZXJzaW9uPTQuMFwiXG5pbXBvcnQgR3RrIGZyb20gXCJnaTovL0d0az92ZXJzaW9uPTQuMFwiXG5pbXBvcnQgR2RrIGZyb20gXCJnaTovL0dkaz92ZXJzaW9uPTQuMFwiXG5pbXBvcnQgYXN0YWxpZnksIHsgdHlwZSBDb25zdHJ1Y3RQcm9wcyB9IGZyb20gXCIuL2FzdGFsaWZ5LmpzXCJcblxuZXhwb3J0IHsgQXN0YWwsIEd0aywgR2RrIH1cbmV4cG9ydCB7IGRlZmF1bHQgYXMgQXBwIH0gZnJvbSBcIi4vYXBwLmpzXCJcbmV4cG9ydCB7IGFzdGFsaWZ5LCBDb25zdHJ1Y3RQcm9wcyB9XG5leHBvcnQgKiBhcyBXaWRnZXQgZnJvbSBcIi4vd2lkZ2V0LmpzXCJcbmV4cG9ydCB7IGhvb2sgfSBmcm9tIFwiLi4vX2FzdGFsXCJcbiIsICJpbXBvcnQgQXN0YWwgZnJvbSBcImdpOi8vQXN0YWxJT1wiXG5pbXBvcnQgQmluZGluZywgeyB0eXBlIENvbm5lY3RhYmxlLCB0eXBlIFN1YnNjcmliYWJsZSB9IGZyb20gXCIuL2JpbmRpbmcuanNcIlxuaW1wb3J0IHsgaW50ZXJ2YWwgfSBmcm9tIFwiLi90aW1lLmpzXCJcbmltcG9ydCB7IGV4ZWNBc3luYywgc3VicHJvY2VzcyB9IGZyb20gXCIuL3Byb2Nlc3MuanNcIlxuXG5jbGFzcyBWYXJpYWJsZVdyYXBwZXI8VD4gZXh0ZW5kcyBGdW5jdGlvbiB7XG4gICAgcHJpdmF0ZSB2YXJpYWJsZSE6IEFzdGFsLlZhcmlhYmxlQmFzZVxuICAgIHByaXZhdGUgZXJySGFuZGxlcj8gPSBjb25zb2xlLmVycm9yXG5cbiAgICBwcml2YXRlIF92YWx1ZTogVFxuICAgIHByaXZhdGUgX3BvbGw/OiBBc3RhbC5UaW1lXG4gICAgcHJpdmF0ZSBfd2F0Y2g/OiBBc3RhbC5Qcm9jZXNzXG5cbiAgICBwcml2YXRlIHBvbGxJbnRlcnZhbCA9IDEwMDBcbiAgICBwcml2YXRlIHBvbGxFeGVjPzogc3RyaW5nW10gfCBzdHJpbmdcbiAgICBwcml2YXRlIHBvbGxUcmFuc2Zvcm0/OiAoc3Rkb3V0OiBzdHJpbmcsIHByZXY6IFQpID0+IFRcbiAgICBwcml2YXRlIHBvbGxGbj86IChwcmV2OiBUKSA9PiBUIHwgUHJvbWlzZTxUPlxuXG4gICAgcHJpdmF0ZSB3YXRjaFRyYW5zZm9ybT86IChzdGRvdXQ6IHN0cmluZywgcHJldjogVCkgPT4gVFxuICAgIHByaXZhdGUgd2F0Y2hFeGVjPzogc3RyaW5nW10gfCBzdHJpbmdcblxuICAgIGNvbnN0cnVjdG9yKGluaXQ6IFQpIHtcbiAgICAgICAgc3VwZXIoKVxuICAgICAgICB0aGlzLl92YWx1ZSA9IGluaXRcbiAgICAgICAgdGhpcy52YXJpYWJsZSA9IG5ldyBBc3RhbC5WYXJpYWJsZUJhc2UoKVxuICAgICAgICB0aGlzLnZhcmlhYmxlLmNvbm5lY3QoXCJkcm9wcGVkXCIsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc3RvcFdhdGNoKClcbiAgICAgICAgICAgIHRoaXMuc3RvcFBvbGwoKVxuICAgICAgICB9KVxuICAgICAgICB0aGlzLnZhcmlhYmxlLmNvbm5lY3QoXCJlcnJvclwiLCAoXywgZXJyKSA9PiB0aGlzLmVyckhhbmRsZXI/LihlcnIpKVxuICAgICAgICByZXR1cm4gbmV3IFByb3h5KHRoaXMsIHtcbiAgICAgICAgICAgIGFwcGx5OiAodGFyZ2V0LCBfLCBhcmdzKSA9PiB0YXJnZXQuX2NhbGwoYXJnc1swXSksXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfY2FsbDxSID0gVD4odHJhbnNmb3JtPzogKHZhbHVlOiBUKSA9PiBSKTogQmluZGluZzxSPiB7XG4gICAgICAgIGNvbnN0IGIgPSBCaW5kaW5nLmJpbmQodGhpcylcbiAgICAgICAgcmV0dXJuIHRyYW5zZm9ybSA/IGIuYXModHJhbnNmb3JtKSA6IGIgYXMgdW5rbm93biBhcyBCaW5kaW5nPFI+XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKSB7XG4gICAgICAgIHJldHVybiBTdHJpbmcoYFZhcmlhYmxlPCR7dGhpcy5nZXQoKX0+YClcbiAgICB9XG5cbiAgICBnZXQoKTogVCB7IHJldHVybiB0aGlzLl92YWx1ZSB9XG4gICAgc2V0KHZhbHVlOiBUKSB7XG4gICAgICAgIGlmICh2YWx1ZSAhPT0gdGhpcy5fdmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWVcbiAgICAgICAgICAgIHRoaXMudmFyaWFibGUuZW1pdChcImNoYW5nZWRcIilcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXJ0UG9sbCgpIHtcbiAgICAgICAgaWYgKHRoaXMuX3BvbGwpXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBpZiAodGhpcy5wb2xsRm4pIHtcbiAgICAgICAgICAgIHRoaXMuX3BvbGwgPSBpbnRlcnZhbCh0aGlzLnBvbGxJbnRlcnZhbCwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHYgPSB0aGlzLnBvbGxGbiEodGhpcy5nZXQoKSlcbiAgICAgICAgICAgICAgICBpZiAodiBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdi50aGVuKHYgPT4gdGhpcy5zZXQodikpXG4gICAgICAgICAgICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHRoaXMudmFyaWFibGUuZW1pdChcImVycm9yXCIsIGVycikpXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXQodilcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMucG9sbEV4ZWMpIHtcbiAgICAgICAgICAgIHRoaXMuX3BvbGwgPSBpbnRlcnZhbCh0aGlzLnBvbGxJbnRlcnZhbCwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIGV4ZWNBc3luYyh0aGlzLnBvbGxFeGVjISlcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4odiA9PiB0aGlzLnNldCh0aGlzLnBvbGxUcmFuc2Zvcm0hKHYsIHRoaXMuZ2V0KCkpKSlcbiAgICAgICAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB0aGlzLnZhcmlhYmxlLmVtaXQoXCJlcnJvclwiLCBlcnIpKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXJ0V2F0Y2goKSB7XG4gICAgICAgIGlmICh0aGlzLl93YXRjaClcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIHRoaXMuX3dhdGNoID0gc3VicHJvY2Vzcyh7XG4gICAgICAgICAgICBjbWQ6IHRoaXMud2F0Y2hFeGVjISxcbiAgICAgICAgICAgIG91dDogb3V0ID0+IHRoaXMuc2V0KHRoaXMud2F0Y2hUcmFuc2Zvcm0hKG91dCwgdGhpcy5nZXQoKSkpLFxuICAgICAgICAgICAgZXJyOiBlcnIgPT4gdGhpcy52YXJpYWJsZS5lbWl0KFwiZXJyb3JcIiwgZXJyKSxcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBzdG9wUG9sbCgpIHtcbiAgICAgICAgdGhpcy5fcG9sbD8uY2FuY2VsKClcbiAgICAgICAgZGVsZXRlIHRoaXMuX3BvbGxcbiAgICB9XG5cbiAgICBzdG9wV2F0Y2goKSB7XG4gICAgICAgIHRoaXMuX3dhdGNoPy5raWxsKClcbiAgICAgICAgZGVsZXRlIHRoaXMuX3dhdGNoXG4gICAgfVxuXG4gICAgaXNQb2xsaW5nKCkgeyByZXR1cm4gISF0aGlzLl9wb2xsIH1cbiAgICBpc1dhdGNoaW5nKCkgeyByZXR1cm4gISF0aGlzLl93YXRjaCB9XG5cbiAgICBkcm9wKCkge1xuICAgICAgICB0aGlzLnZhcmlhYmxlLmVtaXQoXCJkcm9wcGVkXCIpXG4gICAgfVxuXG4gICAgb25Ecm9wcGVkKGNhbGxiYWNrOiAoKSA9PiB2b2lkKSB7XG4gICAgICAgIHRoaXMudmFyaWFibGUuY29ubmVjdChcImRyb3BwZWRcIiwgY2FsbGJhY2spXG4gICAgICAgIHJldHVybiB0aGlzIGFzIHVua25vd24gYXMgVmFyaWFibGU8VD5cbiAgICB9XG5cbiAgICBvbkVycm9yKGNhbGxiYWNrOiAoZXJyOiBzdHJpbmcpID0+IHZvaWQpIHtcbiAgICAgICAgZGVsZXRlIHRoaXMuZXJySGFuZGxlclxuICAgICAgICB0aGlzLnZhcmlhYmxlLmNvbm5lY3QoXCJlcnJvclwiLCAoXywgZXJyKSA9PiBjYWxsYmFjayhlcnIpKVxuICAgICAgICByZXR1cm4gdGhpcyBhcyB1bmtub3duIGFzIFZhcmlhYmxlPFQ+XG4gICAgfVxuXG4gICAgc3Vic2NyaWJlKGNhbGxiYWNrOiAodmFsdWU6IFQpID0+IHZvaWQpIHtcbiAgICAgICAgY29uc3QgaWQgPSB0aGlzLnZhcmlhYmxlLmNvbm5lY3QoXCJjaGFuZ2VkXCIsICgpID0+IHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMuZ2V0KCkpXG4gICAgICAgIH0pXG4gICAgICAgIHJldHVybiAoKSA9PiB0aGlzLnZhcmlhYmxlLmRpc2Nvbm5lY3QoaWQpXG4gICAgfVxuXG4gICAgcG9sbChcbiAgICAgICAgaW50ZXJ2YWw6IG51bWJlcixcbiAgICAgICAgZXhlYzogc3RyaW5nIHwgc3RyaW5nW10sXG4gICAgICAgIHRyYW5zZm9ybT86IChzdGRvdXQ6IHN0cmluZywgcHJldjogVCkgPT4gVFxuICAgICk6IFZhcmlhYmxlPFQ+XG5cbiAgICBwb2xsKFxuICAgICAgICBpbnRlcnZhbDogbnVtYmVyLFxuICAgICAgICBjYWxsYmFjazogKHByZXY6IFQpID0+IFQgfCBQcm9taXNlPFQ+XG4gICAgKTogVmFyaWFibGU8VD5cblxuICAgIHBvbGwoXG4gICAgICAgIGludGVydmFsOiBudW1iZXIsXG4gICAgICAgIGV4ZWM6IHN0cmluZyB8IHN0cmluZ1tdIHwgKChwcmV2OiBUKSA9PiBUIHwgUHJvbWlzZTxUPiksXG4gICAgICAgIHRyYW5zZm9ybTogKHN0ZG91dDogc3RyaW5nLCBwcmV2OiBUKSA9PiBUID0gb3V0ID0+IG91dCBhcyBULFxuICAgICkge1xuICAgICAgICB0aGlzLnN0b3BQb2xsKClcbiAgICAgICAgdGhpcy5wb2xsSW50ZXJ2YWwgPSBpbnRlcnZhbFxuICAgICAgICB0aGlzLnBvbGxUcmFuc2Zvcm0gPSB0cmFuc2Zvcm1cbiAgICAgICAgaWYgKHR5cGVvZiBleGVjID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRoaXMucG9sbEZuID0gZXhlY1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMucG9sbEV4ZWNcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucG9sbEV4ZWMgPSBleGVjXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5wb2xsRm5cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN0YXJ0UG9sbCgpXG4gICAgICAgIHJldHVybiB0aGlzIGFzIHVua25vd24gYXMgVmFyaWFibGU8VD5cbiAgICB9XG5cbiAgICB3YXRjaChcbiAgICAgICAgZXhlYzogc3RyaW5nIHwgc3RyaW5nW10sXG4gICAgICAgIHRyYW5zZm9ybTogKHN0ZG91dDogc3RyaW5nLCBwcmV2OiBUKSA9PiBUID0gb3V0ID0+IG91dCBhcyBULFxuICAgICkge1xuICAgICAgICB0aGlzLnN0b3BXYXRjaCgpXG4gICAgICAgIHRoaXMud2F0Y2hFeGVjID0gZXhlY1xuICAgICAgICB0aGlzLndhdGNoVHJhbnNmb3JtID0gdHJhbnNmb3JtXG4gICAgICAgIHRoaXMuc3RhcnRXYXRjaCgpXG4gICAgICAgIHJldHVybiB0aGlzIGFzIHVua25vd24gYXMgVmFyaWFibGU8VD5cbiAgICB9XG5cbiAgICBvYnNlcnZlKFxuICAgICAgICBvYmpzOiBBcnJheTxbb2JqOiBDb25uZWN0YWJsZSwgc2lnbmFsOiBzdHJpbmddPixcbiAgICAgICAgY2FsbGJhY2s6ICguLi5hcmdzOiBhbnlbXSkgPT4gVCxcbiAgICApOiBWYXJpYWJsZTxUPlxuXG4gICAgb2JzZXJ2ZShcbiAgICAgICAgb2JqOiBDb25uZWN0YWJsZSxcbiAgICAgICAgc2lnbmFsOiBzdHJpbmcsXG4gICAgICAgIGNhbGxiYWNrOiAoLi4uYXJnczogYW55W10pID0+IFQsXG4gICAgKTogVmFyaWFibGU8VD5cblxuICAgIG9ic2VydmUoXG4gICAgICAgIG9ianM6IENvbm5lY3RhYmxlIHwgQXJyYXk8W29iajogQ29ubmVjdGFibGUsIHNpZ25hbDogc3RyaW5nXT4sXG4gICAgICAgIHNpZ09yRm46IHN0cmluZyB8ICgob2JqOiBDb25uZWN0YWJsZSwgLi4uYXJnczogYW55W10pID0+IFQpLFxuICAgICAgICBjYWxsYmFjaz86IChvYmo6IENvbm5lY3RhYmxlLCAuLi5hcmdzOiBhbnlbXSkgPT4gVCxcbiAgICApIHtcbiAgICAgICAgY29uc3QgZiA9IHR5cGVvZiBzaWdPckZuID09PSBcImZ1bmN0aW9uXCIgPyBzaWdPckZuIDogY2FsbGJhY2sgPz8gKCgpID0+IHRoaXMuZ2V0KCkpXG4gICAgICAgIGNvbnN0IHNldCA9IChvYmo6IENvbm5lY3RhYmxlLCAuLi5hcmdzOiBhbnlbXSkgPT4gdGhpcy5zZXQoZihvYmosIC4uLmFyZ3MpKVxuXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9ianMpKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IG9iaiBvZiBvYmpzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgW28sIHNdID0gb2JqXG4gICAgICAgICAgICAgICAgY29uc3QgaWQgPSBvLmNvbm5lY3Qocywgc2V0KVxuICAgICAgICAgICAgICAgIHRoaXMub25Ecm9wcGVkKCgpID0+IG8uZGlzY29ubmVjdChpZCkpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHNpZ09yRm4gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpZCA9IG9ianMuY29ubmVjdChzaWdPckZuLCBzZXQpXG4gICAgICAgICAgICAgICAgdGhpcy5vbkRyb3BwZWQoKCkgPT4gb2Jqcy5kaXNjb25uZWN0KGlkKSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzIGFzIHVua25vd24gYXMgVmFyaWFibGU8VD5cbiAgICB9XG5cbiAgICBzdGF0aWMgZGVyaXZlPFxuICAgICAgICBjb25zdCBEZXBzIGV4dGVuZHMgQXJyYXk8U3Vic2NyaWJhYmxlPGFueT4+LFxuICAgICAgICBBcmdzIGV4dGVuZHMge1xuICAgICAgICAgICAgW0sgaW4ga2V5b2YgRGVwc106IERlcHNbS10gZXh0ZW5kcyBTdWJzY3JpYmFibGU8aW5mZXIgVD4gPyBUIDogbmV2ZXJcbiAgICAgICAgfSxcbiAgICAgICAgViA9IEFyZ3MsXG4gICAgPihkZXBzOiBEZXBzLCBmbjogKC4uLmFyZ3M6IEFyZ3MpID0+IFYgPSAoLi4uYXJncykgPT4gYXJncyBhcyB1bmtub3duIGFzIFYpIHtcbiAgICAgICAgY29uc3QgdXBkYXRlID0gKCkgPT4gZm4oLi4uZGVwcy5tYXAoZCA9PiBkLmdldCgpKSBhcyBBcmdzKVxuICAgICAgICBjb25zdCBkZXJpdmVkID0gbmV3IFZhcmlhYmxlKHVwZGF0ZSgpKVxuICAgICAgICBjb25zdCB1bnN1YnMgPSBkZXBzLm1hcChkZXAgPT4gZGVwLnN1YnNjcmliZSgoKSA9PiBkZXJpdmVkLnNldCh1cGRhdGUoKSkpKVxuICAgICAgICBkZXJpdmVkLm9uRHJvcHBlZCgoKSA9PiB1bnN1YnMubWFwKHVuc3ViID0+IHVuc3ViKCkpKVxuICAgICAgICByZXR1cm4gZGVyaXZlZFxuICAgIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBWYXJpYWJsZTxUPiBleHRlbmRzIE9taXQ8VmFyaWFibGVXcmFwcGVyPFQ+LCBcImJpbmRcIj4ge1xuICAgIDxSPih0cmFuc2Zvcm06ICh2YWx1ZTogVCkgPT4gUik6IEJpbmRpbmc8Uj5cbiAgICAoKTogQmluZGluZzxUPlxufVxuXG5leHBvcnQgY29uc3QgVmFyaWFibGUgPSBuZXcgUHJveHkoVmFyaWFibGVXcmFwcGVyIGFzIGFueSwge1xuICAgIGFwcGx5OiAoX3QsIF9hLCBhcmdzKSA9PiBuZXcgVmFyaWFibGVXcmFwcGVyKGFyZ3NbMF0pLFxufSkgYXMge1xuICAgIGRlcml2ZTogdHlwZW9mIFZhcmlhYmxlV3JhcHBlcltcImRlcml2ZVwiXVxuICAgIDxUPihpbml0OiBUKTogVmFyaWFibGU8VD5cbiAgICBuZXc8VD4oaW5pdDogVCk6IFZhcmlhYmxlPFQ+XG59XG5cbmV4cG9ydCBjb25zdCB7IGRlcml2ZSB9ID0gVmFyaWFibGVcbmV4cG9ydCBkZWZhdWx0IFZhcmlhYmxlXG4iLCAiZXhwb3J0IGNvbnN0IHNuYWtlaWZ5ID0gKHN0cjogc3RyaW5nKSA9PiBzdHJcbiAgICAucmVwbGFjZSgvKFthLXpdKShbQS1aXSkvZywgXCIkMV8kMlwiKVxuICAgIC5yZXBsYWNlQWxsKFwiLVwiLCBcIl9cIilcbiAgICAudG9Mb3dlckNhc2UoKVxuXG5leHBvcnQgY29uc3Qga2ViYWJpZnkgPSAoc3RyOiBzdHJpbmcpID0+IHN0clxuICAgIC5yZXBsYWNlKC8oW2Etel0pKFtBLVpdKS9nLCBcIiQxLSQyXCIpXG4gICAgLnJlcGxhY2VBbGwoXCJfXCIsIFwiLVwiKVxuICAgIC50b0xvd2VyQ2FzZSgpXG5cbmV4cG9ydCBpbnRlcmZhY2UgU3Vic2NyaWJhYmxlPFQgPSB1bmtub3duPiB7XG4gICAgc3Vic2NyaWJlKGNhbGxiYWNrOiAodmFsdWU6IFQpID0+IHZvaWQpOiAoKSA9PiB2b2lkXG4gICAgZ2V0KCk6IFRcbiAgICBba2V5OiBzdHJpbmddOiBhbnlcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb25uZWN0YWJsZSB7XG4gICAgY29ubmVjdChzaWduYWw6IHN0cmluZywgY2FsbGJhY2s6ICguLi5hcmdzOiBhbnlbXSkgPT4gdW5rbm93bik6IG51bWJlclxuICAgIGRpc2Nvbm5lY3QoaWQ6IG51bWJlcik6IHZvaWRcbiAgICBba2V5OiBzdHJpbmddOiBhbnlcbn1cblxuZXhwb3J0IGNsYXNzIEJpbmRpbmc8VmFsdWU+IHtcbiAgICBwcml2YXRlIHRyYW5zZm9ybUZuID0gKHY6IGFueSkgPT4gdlxuXG4gICAgI2VtaXR0ZXI6IFN1YnNjcmliYWJsZTxWYWx1ZT4gfCBDb25uZWN0YWJsZVxuICAgICNwcm9wPzogc3RyaW5nXG5cbiAgICBzdGF0aWMgYmluZDxcbiAgICAgICAgVCBleHRlbmRzIENvbm5lY3RhYmxlLFxuICAgICAgICBQIGV4dGVuZHMga2V5b2YgVCxcbiAgICA+KG9iamVjdDogVCwgcHJvcGVydHk6IFApOiBCaW5kaW5nPFRbUF0+XG5cbiAgICBzdGF0aWMgYmluZDxUPihvYmplY3Q6IFN1YnNjcmliYWJsZTxUPik6IEJpbmRpbmc8VD5cblxuICAgIHN0YXRpYyBiaW5kKGVtaXR0ZXI6IENvbm5lY3RhYmxlIHwgU3Vic2NyaWJhYmxlLCBwcm9wPzogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBuZXcgQmluZGluZyhlbWl0dGVyLCBwcm9wKVxuICAgIH1cblxuICAgIHByaXZhdGUgY29uc3RydWN0b3IoZW1pdHRlcjogQ29ubmVjdGFibGUgfCBTdWJzY3JpYmFibGU8VmFsdWU+LCBwcm9wPzogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuI2VtaXR0ZXIgPSBlbWl0dGVyXG4gICAgICAgIHRoaXMuI3Byb3AgPSBwcm9wICYmIGtlYmFiaWZ5KHByb3ApXG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKSB7XG4gICAgICAgIHJldHVybiBgQmluZGluZzwke3RoaXMuI2VtaXR0ZXJ9JHt0aGlzLiNwcm9wID8gYCwgXCIke3RoaXMuI3Byb3B9XCJgIDogXCJcIn0+YFxuICAgIH1cblxuICAgIGFzPFQ+KGZuOiAodjogVmFsdWUpID0+IFQpOiBCaW5kaW5nPFQ+IHtcbiAgICAgICAgY29uc3QgYmluZCA9IG5ldyBCaW5kaW5nKHRoaXMuI2VtaXR0ZXIsIHRoaXMuI3Byb3ApXG4gICAgICAgIGJpbmQudHJhbnNmb3JtRm4gPSAodjogVmFsdWUpID0+IGZuKHRoaXMudHJhbnNmb3JtRm4odikpXG4gICAgICAgIHJldHVybiBiaW5kIGFzIHVua25vd24gYXMgQmluZGluZzxUPlxuICAgIH1cblxuICAgIGdldCgpOiBWYWx1ZSB7XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy4jZW1pdHRlci5nZXQgPT09IFwiZnVuY3Rpb25cIilcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRyYW5zZm9ybUZuKHRoaXMuI2VtaXR0ZXIuZ2V0KCkpXG5cbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLiNwcm9wID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBjb25zdCBnZXR0ZXIgPSBgZ2V0XyR7c25ha2VpZnkodGhpcy4jcHJvcCl9YFxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLiNlbWl0dGVyW2dldHRlcl0gPT09IFwiZnVuY3Rpb25cIilcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy50cmFuc2Zvcm1Gbih0aGlzLiNlbWl0dGVyW2dldHRlcl0oKSlcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudHJhbnNmb3JtRm4odGhpcy4jZW1pdHRlclt0aGlzLiNwcm9wXSlcbiAgICAgICAgfVxuXG4gICAgICAgIHRocm93IEVycm9yKFwiY2FuIG5vdCBnZXQgdmFsdWUgb2YgYmluZGluZ1wiKVxuICAgIH1cblxuICAgIHN1YnNjcmliZShjYWxsYmFjazogKHZhbHVlOiBWYWx1ZSkgPT4gdm9pZCk6ICgpID0+IHZvaWQge1xuICAgICAgICBpZiAodHlwZW9mIHRoaXMuI2VtaXR0ZXIuc3Vic2NyaWJlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLiNlbWl0dGVyLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5nZXQoKSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHRoaXMuI2VtaXR0ZXIuY29ubmVjdCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBjb25zdCBzaWduYWwgPSBgbm90aWZ5Ojoke3RoaXMuI3Byb3B9YFxuICAgICAgICAgICAgY29uc3QgaWQgPSB0aGlzLiNlbWl0dGVyLmNvbm5lY3Qoc2lnbmFsLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5nZXQoKSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgICAgICh0aGlzLiNlbWl0dGVyLmRpc2Nvbm5lY3QgYXMgQ29ubmVjdGFibGVbXCJkaXNjb25uZWN0XCJdKShpZClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBFcnJvcihgJHt0aGlzLiNlbWl0dGVyfSBpcyBub3QgYmluZGFibGVgKVxuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IHsgYmluZCB9ID0gQmluZGluZ1xuZXhwb3J0IGRlZmF1bHQgQmluZGluZ1xuIiwgImltcG9ydCBBc3RhbCBmcm9tIFwiZ2k6Ly9Bc3RhbElPXCJcblxuZXhwb3J0IHR5cGUgVGltZSA9IEFzdGFsLlRpbWVcbmV4cG9ydCBjb25zdCBUaW1lID0gQXN0YWwuVGltZVxuXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJ2YWwoaW50ZXJ2YWw6IG51bWJlciwgY2FsbGJhY2s/OiAoKSA9PiB2b2lkKSB7XG4gICAgcmV0dXJuIEFzdGFsLlRpbWUuaW50ZXJ2YWwoaW50ZXJ2YWwsICgpID0+IHZvaWQgY2FsbGJhY2s/LigpKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdGltZW91dCh0aW1lb3V0OiBudW1iZXIsIGNhbGxiYWNrPzogKCkgPT4gdm9pZCkge1xuICAgIHJldHVybiBBc3RhbC5UaW1lLnRpbWVvdXQodGltZW91dCwgKCkgPT4gdm9pZCBjYWxsYmFjaz8uKCkpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpZGxlKGNhbGxiYWNrPzogKCkgPT4gdm9pZCkge1xuICAgIHJldHVybiBBc3RhbC5UaW1lLmlkbGUoKCkgPT4gdm9pZCBjYWxsYmFjaz8uKCkpXG59XG4iLCAiaW1wb3J0IEFzdGFsIGZyb20gXCJnaTovL0FzdGFsSU9cIlxuXG50eXBlIEFyZ3MgPSB7XG4gICAgY21kOiBzdHJpbmcgfCBzdHJpbmdbXVxuICAgIG91dD86IChzdGRvdXQ6IHN0cmluZykgPT4gdm9pZFxuICAgIGVycj86IChzdGRlcnI6IHN0cmluZykgPT4gdm9pZFxufVxuXG5leHBvcnQgdHlwZSBQcm9jZXNzID0gQXN0YWwuUHJvY2Vzc1xuZXhwb3J0IGNvbnN0IFByb2Nlc3MgPSBBc3RhbC5Qcm9jZXNzXG5cbmV4cG9ydCBmdW5jdGlvbiBzdWJwcm9jZXNzKGFyZ3M6IEFyZ3MpOiBBc3RhbC5Qcm9jZXNzXG5cbmV4cG9ydCBmdW5jdGlvbiBzdWJwcm9jZXNzKFxuICAgIGNtZDogc3RyaW5nIHwgc3RyaW5nW10sXG4gICAgb25PdXQ/OiAoc3Rkb3V0OiBzdHJpbmcpID0+IHZvaWQsXG4gICAgb25FcnI/OiAoc3RkZXJyOiBzdHJpbmcpID0+IHZvaWQsXG4pOiBBc3RhbC5Qcm9jZXNzXG5cbmV4cG9ydCBmdW5jdGlvbiBzdWJwcm9jZXNzKFxuICAgIGFyZ3NPckNtZDogQXJncyB8IHN0cmluZyB8IHN0cmluZ1tdLFxuICAgIG9uT3V0OiAoc3Rkb3V0OiBzdHJpbmcpID0+IHZvaWQgPSBwcmludCxcbiAgICBvbkVycjogKHN0ZGVycjogc3RyaW5nKSA9PiB2b2lkID0gcHJpbnRlcnIsXG4pIHtcbiAgICBjb25zdCBhcmdzID0gQXJyYXkuaXNBcnJheShhcmdzT3JDbWQpIHx8IHR5cGVvZiBhcmdzT3JDbWQgPT09IFwic3RyaW5nXCJcbiAgICBjb25zdCB7IGNtZCwgZXJyLCBvdXQgfSA9IHtcbiAgICAgICAgY21kOiBhcmdzID8gYXJnc09yQ21kIDogYXJnc09yQ21kLmNtZCxcbiAgICAgICAgZXJyOiBhcmdzID8gb25FcnIgOiBhcmdzT3JDbWQuZXJyIHx8IG9uRXJyLFxuICAgICAgICBvdXQ6IGFyZ3MgPyBvbk91dCA6IGFyZ3NPckNtZC5vdXQgfHwgb25PdXQsXG4gICAgfVxuXG4gICAgY29uc3QgcHJvYyA9IEFycmF5LmlzQXJyYXkoY21kKVxuICAgICAgICA/IEFzdGFsLlByb2Nlc3Muc3VicHJvY2Vzc3YoY21kKVxuICAgICAgICA6IEFzdGFsLlByb2Nlc3Muc3VicHJvY2VzcyhjbWQpXG5cbiAgICBwcm9jLmNvbm5lY3QoXCJzdGRvdXRcIiwgKF8sIHN0ZG91dDogc3RyaW5nKSA9PiBvdXQoc3Rkb3V0KSlcbiAgICBwcm9jLmNvbm5lY3QoXCJzdGRlcnJcIiwgKF8sIHN0ZGVycjogc3RyaW5nKSA9PiBlcnIoc3RkZXJyKSlcbiAgICByZXR1cm4gcHJvY1xufVxuXG4vKiogQHRocm93cyB7R0xpYi5FcnJvcn0gVGhyb3dzIHN0ZGVyciAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4ZWMoY21kOiBzdHJpbmcgfCBzdHJpbmdbXSkge1xuICAgIHJldHVybiBBcnJheS5pc0FycmF5KGNtZClcbiAgICAgICAgPyBBc3RhbC5Qcm9jZXNzLmV4ZWN2KGNtZClcbiAgICAgICAgOiBBc3RhbC5Qcm9jZXNzLmV4ZWMoY21kKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZXhlY0FzeW5jKGNtZDogc3RyaW5nIHwgc3RyaW5nW10pOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGNtZCkpIHtcbiAgICAgICAgICAgIEFzdGFsLlByb2Nlc3MuZXhlY19hc3luY3YoY21kLCAoXywgcmVzKSA9PiB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShBc3RhbC5Qcm9jZXNzLmV4ZWNfYXN5bmN2X2ZpbmlzaChyZXMpKVxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcilcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgQXN0YWwuUHJvY2Vzcy5leGVjX2FzeW5jKGNtZCwgKF8sIHJlcykgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoQXN0YWwuUHJvY2Vzcy5leGVjX2ZpbmlzaChyZXMpKVxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcilcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfSlcbn1cbiIsICJpbXBvcnQgVmFyaWFibGUgZnJvbSBcIi4vdmFyaWFibGUuanNcIlxuaW1wb3J0IHsgZXhlY0FzeW5jIH0gZnJvbSBcIi4vcHJvY2Vzcy5qc1wiXG5pbXBvcnQgQmluZGluZywgeyBDb25uZWN0YWJsZSwga2ViYWJpZnksIHNuYWtlaWZ5LCBTdWJzY3JpYmFibGUgfSBmcm9tIFwiLi9iaW5kaW5nLmpzXCJcblxuZXhwb3J0IGNvbnN0IG5vSW1wbGljaXREZXN0cm95ID0gU3ltYm9sKFwibm8gbm8gaW1wbGljaXQgZGVzdHJveVwiKVxuZXhwb3J0IGNvbnN0IHNldENoaWxkcmVuID0gU3ltYm9sKFwiY2hpbGRyZW4gc2V0dGVyIG1ldGhvZFwiKVxuXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2VCaW5kaW5ncyhhcnJheTogYW55W10pIHtcbiAgICBmdW5jdGlvbiBnZXRWYWx1ZXMoLi4uYXJnczogYW55W10pIHtcbiAgICAgICAgbGV0IGkgPSAwXG4gICAgICAgIHJldHVybiBhcnJheS5tYXAodmFsdWUgPT4gdmFsdWUgaW5zdGFuY2VvZiBCaW5kaW5nXG4gICAgICAgICAgICA/IGFyZ3NbaSsrXVxuICAgICAgICAgICAgOiB2YWx1ZSxcbiAgICAgICAgKVxuICAgIH1cblxuICAgIGNvbnN0IGJpbmRpbmdzID0gYXJyYXkuZmlsdGVyKGkgPT4gaSBpbnN0YW5jZW9mIEJpbmRpbmcpXG5cbiAgICBpZiAoYmluZGluZ3MubGVuZ3RoID09PSAwKVxuICAgICAgICByZXR1cm4gYXJyYXlcblxuICAgIGlmIChiaW5kaW5ncy5sZW5ndGggPT09IDEpXG4gICAgICAgIHJldHVybiBiaW5kaW5nc1swXS5hcyhnZXRWYWx1ZXMpXG5cbiAgICByZXR1cm4gVmFyaWFibGUuZGVyaXZlKGJpbmRpbmdzLCBnZXRWYWx1ZXMpKClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFByb3Aob2JqOiBhbnksIHByb3A6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHNldHRlciA9IGBzZXRfJHtzbmFrZWlmeShwcm9wKX1gXG4gICAgICAgIGlmICh0eXBlb2Ygb2JqW3NldHRlcl0gPT09IFwiZnVuY3Rpb25cIilcbiAgICAgICAgICAgIHJldHVybiBvYmpbc2V0dGVyXSh2YWx1ZSlcblxuICAgICAgICByZXR1cm4gKG9ialtwcm9wXSA9IHZhbHVlKVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYGNvdWxkIG5vdCBzZXQgcHJvcGVydHkgXCIke3Byb3B9XCIgb24gJHtvYmp9OmAsIGVycm9yKVxuICAgIH1cbn1cblxuZXhwb3J0IHR5cGUgQmluZGFibGVQcm9wczxUPiA9IHtcbiAgICBbSyBpbiBrZXlvZiBUXTogQmluZGluZzxUW0tdPiB8IFRbS107XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBob29rPFdpZGdldCBleHRlbmRzIENvbm5lY3RhYmxlPihcbiAgICB3aWRnZXQ6IFdpZGdldCxcbiAgICBvYmplY3Q6IENvbm5lY3RhYmxlIHwgU3Vic2NyaWJhYmxlLFxuICAgIHNpZ25hbE9yQ2FsbGJhY2s6IHN0cmluZyB8ICgoc2VsZjogV2lkZ2V0LCAuLi5hcmdzOiBhbnlbXSkgPT4gdm9pZCksXG4gICAgY2FsbGJhY2s/OiAoc2VsZjogV2lkZ2V0LCAuLi5hcmdzOiBhbnlbXSkgPT4gdm9pZCxcbikge1xuICAgIGlmICh0eXBlb2Ygb2JqZWN0LmNvbm5lY3QgPT09IFwiZnVuY3Rpb25cIiAmJiBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBpZCA9IG9iamVjdC5jb25uZWN0KHNpZ25hbE9yQ2FsbGJhY2ssIChfOiBhbnksIC4uLmFyZ3M6IHVua25vd25bXSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKHdpZGdldCwgLi4uYXJncylcbiAgICAgICAgfSlcbiAgICAgICAgd2lkZ2V0LmNvbm5lY3QoXCJkZXN0cm95XCIsICgpID0+IHtcbiAgICAgICAgICAgIChvYmplY3QuZGlzY29ubmVjdCBhcyBDb25uZWN0YWJsZVtcImRpc2Nvbm5lY3RcIl0pKGlkKVxuICAgICAgICB9KVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIG9iamVjdC5zdWJzY3JpYmUgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2Ygc2lnbmFsT3JDYWxsYmFjayA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGNvbnN0IHVuc3ViID0gb2JqZWN0LnN1YnNjcmliZSgoLi4uYXJnczogdW5rbm93bltdKSA9PiB7XG4gICAgICAgICAgICBzaWduYWxPckNhbGxiYWNrKHdpZGdldCwgLi4uYXJncylcbiAgICAgICAgfSlcbiAgICAgICAgd2lkZ2V0LmNvbm5lY3QoXCJkZXN0cm95XCIsIHVuc3ViKVxuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbnN0cnVjdDxXaWRnZXQgZXh0ZW5kcyBDb25uZWN0YWJsZSAmIHsgW3NldENoaWxkcmVuXTogKGNoaWxkcmVuOiBhbnlbXSkgPT4gdm9pZCB9Pih3aWRnZXQ6IFdpZGdldCwgY29uZmlnOiBhbnkpIHtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcHJlZmVyLWNvbnN0XG4gICAgbGV0IHsgc2V0dXAsIGNoaWxkLCBjaGlsZHJlbiA9IFtdLCAuLi5wcm9wcyB9ID0gY29uZmlnXG5cbiAgICBpZiAoY2hpbGRyZW4gaW5zdGFuY2VvZiBCaW5kaW5nKSB7XG4gICAgICAgIGNoaWxkcmVuID0gW2NoaWxkcmVuXVxuICAgIH1cblxuICAgIGlmIChjaGlsZCkge1xuICAgICAgICBjaGlsZHJlbi51bnNoaWZ0KGNoaWxkKVxuICAgIH1cblxuICAgIC8vIHJlbW92ZSB1bmRlZmluZWQgdmFsdWVzXG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMocHJvcHMpKSB7XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBkZWxldGUgcHJvcHNba2V5XVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gY29sbGVjdCBiaW5kaW5nc1xuICAgIGNvbnN0IGJpbmRpbmdzOiBBcnJheTxbc3RyaW5nLCBCaW5kaW5nPGFueT5dPiA9IE9iamVjdFxuICAgICAgICAua2V5cyhwcm9wcylcbiAgICAgICAgLnJlZHVjZSgoYWNjOiBhbnksIHByb3ApID0+IHtcbiAgICAgICAgICAgIGlmIChwcm9wc1twcm9wXSBpbnN0YW5jZW9mIEJpbmRpbmcpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBiaW5kaW5nID0gcHJvcHNbcHJvcF1cbiAgICAgICAgICAgICAgICBkZWxldGUgcHJvcHNbcHJvcF1cbiAgICAgICAgICAgICAgICByZXR1cm4gWy4uLmFjYywgW3Byb3AsIGJpbmRpbmddXVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFjY1xuICAgICAgICB9LCBbXSlcblxuICAgIC8vIGNvbGxlY3Qgc2lnbmFsIGhhbmRsZXJzXG4gICAgY29uc3Qgb25IYW5kbGVyczogQXJyYXk8W3N0cmluZywgc3RyaW5nIHwgKCgpID0+IHVua25vd24pXT4gPSBPYmplY3RcbiAgICAgICAgLmtleXMocHJvcHMpXG4gICAgICAgIC5yZWR1Y2UoKGFjYzogYW55LCBrZXkpID0+IHtcbiAgICAgICAgICAgIGlmIChrZXkuc3RhcnRzV2l0aChcIm9uXCIpKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2lnID0ga2ViYWJpZnkoa2V5KS5zcGxpdChcIi1cIikuc2xpY2UoMSkuam9pbihcIi1cIilcbiAgICAgICAgICAgICAgICBjb25zdCBoYW5kbGVyID0gcHJvcHNba2V5XVxuICAgICAgICAgICAgICAgIGRlbGV0ZSBwcm9wc1trZXldXG4gICAgICAgICAgICAgICAgcmV0dXJuIFsuLi5hY2MsIFtzaWcsIGhhbmRsZXJdXVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFjY1xuICAgICAgICB9LCBbXSlcblxuICAgIC8vIHNldCBjaGlsZHJlblxuICAgIGNvbnN0IG1lcmdlZENoaWxkcmVuID0gbWVyZ2VCaW5kaW5ncyhjaGlsZHJlbi5mbGF0KEluZmluaXR5KSlcbiAgICBpZiAobWVyZ2VkQ2hpbGRyZW4gaW5zdGFuY2VvZiBCaW5kaW5nKSB7XG4gICAgICAgIHdpZGdldFtzZXRDaGlsZHJlbl0obWVyZ2VkQ2hpbGRyZW4uZ2V0KCkpXG4gICAgICAgIHdpZGdldC5jb25uZWN0KFwiZGVzdHJveVwiLCBtZXJnZWRDaGlsZHJlbi5zdWJzY3JpYmUoKHYpID0+IHtcbiAgICAgICAgICAgIHdpZGdldFtzZXRDaGlsZHJlbl0odilcbiAgICAgICAgfSkpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKG1lcmdlZENoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHdpZGdldFtzZXRDaGlsZHJlbl0obWVyZ2VkQ2hpbGRyZW4pXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBzZXR1cCBzaWduYWwgaGFuZGxlcnNcbiAgICBmb3IgKGNvbnN0IFtzaWduYWwsIGNhbGxiYWNrXSBvZiBvbkhhbmRsZXJzKSB7XG4gICAgICAgIGNvbnN0IHNpZyA9IHNpZ25hbC5zdGFydHNXaXRoKFwibm90aWZ5XCIpXG4gICAgICAgICAgICA/IHNpZ25hbC5yZXBsYWNlKFwiLVwiLCBcIjo6XCIpXG4gICAgICAgICAgICA6IHNpZ25hbFxuXG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgd2lkZ2V0LmNvbm5lY3Qoc2lnLCBjYWxsYmFjaylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHdpZGdldC5jb25uZWN0KHNpZywgKCkgPT4gZXhlY0FzeW5jKGNhbGxiYWNrKVxuICAgICAgICAgICAgICAgIC50aGVuKHByaW50KS5jYXRjaChjb25zb2xlLmVycm9yKSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIHNldHVwIGJpbmRpbmdzIGhhbmRsZXJzXG4gICAgZm9yIChjb25zdCBbcHJvcCwgYmluZGluZ10gb2YgYmluZGluZ3MpIHtcbiAgICAgICAgaWYgKHByb3AgPT09IFwiY2hpbGRcIiB8fCBwcm9wID09PSBcImNoaWxkcmVuXCIpIHtcbiAgICAgICAgICAgIHdpZGdldC5jb25uZWN0KFwiZGVzdHJveVwiLCBiaW5kaW5nLnN1YnNjcmliZSgodjogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgd2lkZ2V0W3NldENoaWxkcmVuXSh2KVxuICAgICAgICAgICAgfSkpXG4gICAgICAgIH1cbiAgICAgICAgd2lkZ2V0LmNvbm5lY3QoXCJkZXN0cm95XCIsIGJpbmRpbmcuc3Vic2NyaWJlKCh2OiBhbnkpID0+IHtcbiAgICAgICAgICAgIHNldFByb3Aod2lkZ2V0LCBwcm9wLCB2KVxuICAgICAgICB9KSlcbiAgICAgICAgc2V0UHJvcCh3aWRnZXQsIHByb3AsIGJpbmRpbmcuZ2V0KCkpXG4gICAgfVxuXG4gICAgLy8gZmlsdGVyIHVuZGVmaW5lZCB2YWx1ZXNcbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhwcm9wcykpIHtcbiAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBwcm9wc1trZXldXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBPYmplY3QuYXNzaWduKHdpZGdldCwgcHJvcHMpXG4gICAgc2V0dXA/Lih3aWRnZXQpXG4gICAgcmV0dXJuIHdpZGdldFxufVxuXG5mdW5jdGlvbiBpc0Fycm93RnVuY3Rpb24oZnVuYzogYW55KTogZnVuYyBpcyAoYXJnczogYW55KSA9PiBhbnkge1xuICAgIHJldHVybiAhT2JqZWN0Lmhhc093bihmdW5jLCBcInByb3RvdHlwZVwiKVxufVxuXG5leHBvcnQgZnVuY3Rpb24ganN4KFxuICAgIGN0b3JzOiBSZWNvcmQ8c3RyaW5nLCB7IG5ldyhwcm9wczogYW55KTogYW55IH0gfCAoKHByb3BzOiBhbnkpID0+IGFueSk+LFxuICAgIGN0b3I6IHN0cmluZyB8ICgocHJvcHM6IGFueSkgPT4gYW55KSB8IHsgbmV3KHByb3BzOiBhbnkpOiBhbnkgfSxcbiAgICB7IGNoaWxkcmVuLCAuLi5wcm9wcyB9OiBhbnksXG4pIHtcbiAgICBjaGlsZHJlbiA/Pz0gW11cblxuICAgIGlmICghQXJyYXkuaXNBcnJheShjaGlsZHJlbikpXG4gICAgICAgIGNoaWxkcmVuID0gW2NoaWxkcmVuXVxuXG4gICAgY2hpbGRyZW4gPSBjaGlsZHJlbi5maWx0ZXIoQm9vbGVhbilcblxuICAgIGlmIChjaGlsZHJlbi5sZW5ndGggPT09IDEpXG4gICAgICAgIHByb3BzLmNoaWxkID0gY2hpbGRyZW5bMF1cbiAgICBlbHNlIGlmIChjaGlsZHJlbi5sZW5ndGggPiAxKVxuICAgICAgICBwcm9wcy5jaGlsZHJlbiA9IGNoaWxkcmVuXG5cbiAgICBpZiAodHlwZW9mIGN0b3IgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgaWYgKGlzQXJyb3dGdW5jdGlvbihjdG9yc1tjdG9yXSkpXG4gICAgICAgICAgICByZXR1cm4gY3RvcnNbY3Rvcl0ocHJvcHMpXG5cbiAgICAgICAgcmV0dXJuIG5ldyBjdG9yc1tjdG9yXShwcm9wcylcbiAgICB9XG5cbiAgICBpZiAoaXNBcnJvd0Z1bmN0aW9uKGN0b3IpKVxuICAgICAgICByZXR1cm4gY3Rvcihwcm9wcylcblxuICAgIHJldHVybiBuZXcgY3Rvcihwcm9wcylcbn1cbiIsICJpbXBvcnQgeyBub0ltcGxpY2l0RGVzdHJveSwgc2V0Q2hpbGRyZW4sIHR5cGUgQmluZGFibGVQcm9wcywgY29uc3RydWN0IH0gZnJvbSBcIi4uL19hc3RhbC5qc1wiXG5pbXBvcnQgR3RrIGZyb20gXCJnaTovL0d0az92ZXJzaW9uPTQuMFwiXG5pbXBvcnQgR2RrIGZyb20gXCJnaTovL0dkaz92ZXJzaW9uPTQuMFwiXG5pbXBvcnQgQmluZGluZyBmcm9tIFwiLi4vYmluZGluZy5qc1wiXG5cbmV4cG9ydCBjb25zdCB0eXBlID0gU3ltYm9sKFwiY2hpbGQgdHlwZVwiKVxuY29uc3QgZHVtbXlCdWxkZXIgPSBuZXcgR3RrLkJ1aWxkZXJcblxuZnVuY3Rpb24gX2dldENoaWxkcmVuKHdpZGdldDogR3RrLldpZGdldCk6IEFycmF5PEd0ay5XaWRnZXQ+IHtcbiAgICBpZiAoXCJnZXRfY2hpbGRcIiBpbiB3aWRnZXQgJiYgdHlwZW9mIHdpZGdldC5nZXRfY2hpbGQgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHJldHVybiB3aWRnZXQuZ2V0X2NoaWxkKCkgPyBbd2lkZ2V0LmdldF9jaGlsZCgpXSA6IFtdXG4gICAgfVxuXG4gICAgY29uc3QgY2hpbGRyZW46IEFycmF5PEd0ay5XaWRnZXQ+ID0gW11cbiAgICBsZXQgY2ggPSB3aWRnZXQuZ2V0X2ZpcnN0X2NoaWxkKClcbiAgICB3aGlsZSAoY2ggIT09IG51bGwpIHtcbiAgICAgICAgY2hpbGRyZW4ucHVzaChjaClcbiAgICAgICAgY2ggPSBjaC5nZXRfbmV4dF9zaWJsaW5nKClcbiAgICB9XG4gICAgcmV0dXJuIGNoaWxkcmVuXG59XG5cbmZ1bmN0aW9uIF9zZXRDaGlsZHJlbih3aWRnZXQ6IEd0ay5XaWRnZXQsIGNoaWxkcmVuOiBhbnlbXSkge1xuICAgIGNoaWxkcmVuID0gY2hpbGRyZW4uZmxhdChJbmZpbml0eSkubWFwKGNoID0+IGNoIGluc3RhbmNlb2YgR3RrLldpZGdldFxuICAgICAgICA/IGNoXG4gICAgICAgIDogbmV3IEd0ay5MYWJlbCh7IHZpc2libGU6IHRydWUsIGxhYmVsOiBTdHJpbmcoY2gpIH0pKVxuXG5cbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGNoaWxkcmVuKSB7XG4gICAgICAgIHdpZGdldC52ZnVuY19hZGRfY2hpbGQoXG4gICAgICAgICAgICBkdW1teUJ1bGRlcixcbiAgICAgICAgICAgIGNoaWxkLFxuICAgICAgICAgICAgdHlwZSBpbiBjaGlsZCA/IGNoaWxkW3R5cGVdIDogbnVsbCxcbiAgICAgICAgKVxuICAgIH1cbn1cblxudHlwZSBDb25maWc8VCBleHRlbmRzIEd0ay5XaWRnZXQ+ID0ge1xuICAgIHNldENoaWxkcmVuKHdpZGdldDogVCwgY2hpbGRyZW46IGFueVtdKTogdm9pZFxuICAgIGdldENoaWxkcmVuKHdpZGdldDogVCk6IEFycmF5PEd0ay5XaWRnZXQ+XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGFzdGFsaWZ5PFxuICAgIFdpZGdldCBleHRlbmRzIEd0ay5XaWRnZXQsXG4gICAgUHJvcHMgZXh0ZW5kcyBHdGsuV2lkZ2V0LkNvbnN0cnVjdG9yUHJvcHMgPSBHdGsuV2lkZ2V0LkNvbnN0cnVjdG9yUHJvcHMsXG4gICAgU2lnbmFscyBleHRlbmRzIFJlY29yZDxgb24ke3N0cmluZ31gLCBBcnJheTx1bmtub3duPj4gPSBSZWNvcmQ8YG9uJHtzdHJpbmd9YCwgYW55W10+LFxuPihjbHM6IHsgbmV3KC4uLmFyZ3M6IGFueVtdKTogV2lkZ2V0IH0sIGNvbmZpZzogUGFydGlhbDxDb25maWc8V2lkZ2V0Pj4gPSB7fSkge1xuICAgIE9iamVjdC5hc3NpZ24oY2xzLnByb3RvdHlwZSwge1xuICAgICAgICBbc2V0Q2hpbGRyZW5dKGNoaWxkcmVuOiBhbnlbXSkge1xuICAgICAgICAgICAgY29uc3QgdyA9IHRoaXMgYXMgdW5rbm93biBhcyBXaWRnZXRcbiAgICAgICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKGNvbmZpZy5nZXRDaGlsZHJlbj8uKHcpIHx8IF9nZXRDaGlsZHJlbih3KSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2hpbGQgaW5zdGFuY2VvZiBHdGsuV2lkZ2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNoaWxkLnVucGFyZW50KClcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjaGlsZHJlbi5pbmNsdWRlcyhjaGlsZCkgJiYgbm9JbXBsaWNpdERlc3Ryb3kgaW4gdGhpcylcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLnJ1bl9kaXNwb3NlKClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjb25maWcuc2V0Q2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICBjb25maWcuc2V0Q2hpbGRyZW4odywgY2hpbGRyZW4pXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIF9zZXRDaGlsZHJlbih3LCBjaGlsZHJlbilcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9KVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgW2Nscy5uYW1lXTogKFxuICAgICAgICAgICAgcHJvcHM6IENvbnN0cnVjdFByb3BzPFdpZGdldCwgUHJvcHMsIFNpZ25hbHM+ID0ge30sXG4gICAgICAgICAgICAuLi5jaGlsZHJlbjogYW55W11cbiAgICAgICAgKTogV2lkZ2V0ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHdpZGdldCA9IG5ldyBjbHMoXCJjc3NOYW1lXCIgaW4gcHJvcHMgPyB7IGNzc05hbWU6IHByb3BzLmNzc05hbWUgfSA6IHt9KVxuXG4gICAgICAgICAgICBpZiAoXCJjc3NOYW1lXCIgaW4gcHJvcHMpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgcHJvcHMuY3NzTmFtZVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocHJvcHMubm9JbXBsaWNpdERlc3Ryb3kpIHtcbiAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKHdpZGdldCwgeyBbbm9JbXBsaWNpdERlc3Ryb3ldOiB0cnVlIH0pXG4gICAgICAgICAgICAgICAgZGVsZXRlIHByb3BzLm5vSW1wbGljaXREZXN0cm95XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChwcm9wcy50eXBlKSB7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbih3aWRnZXQsIHsgW3R5cGVdOiBwcm9wcy50eXBlIH0pXG4gICAgICAgICAgICAgICAgZGVsZXRlIHByb3BzLnR5cGVcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKHByb3BzLCB7IGNoaWxkcmVuIH0pXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBjb25zdHJ1Y3Qod2lkZ2V0IGFzIGFueSwgc2V0dXBDb250cm9sbGVycyh3aWRnZXQsIHByb3BzIGFzIGFueSkpXG4gICAgICAgIH0sXG4gICAgfVtjbHMubmFtZV1cbn1cblxudHlwZSBTaWdIYW5kbGVyPFxuICAgIFcgZXh0ZW5kcyBJbnN0YW5jZVR5cGU8dHlwZW9mIEd0ay5XaWRnZXQ+LFxuICAgIEFyZ3MgZXh0ZW5kcyBBcnJheTx1bmtub3duPixcbj4gPSAoKHNlbGY6IFcsIC4uLmFyZ3M6IEFyZ3MpID0+IHVua25vd24pIHwgc3RyaW5nIHwgc3RyaW5nW11cblxuZXhwb3J0IHsgQmluZGFibGVQcm9wcyB9XG5leHBvcnQgdHlwZSBCaW5kYWJsZUNoaWxkID0gR3RrLldpZGdldCB8IEJpbmRpbmc8R3RrLldpZGdldD5cblxuZXhwb3J0IHR5cGUgQ29uc3RydWN0UHJvcHM8XG4gICAgU2VsZiBleHRlbmRzIEluc3RhbmNlVHlwZTx0eXBlb2YgR3RrLldpZGdldD4sXG4gICAgUHJvcHMgZXh0ZW5kcyBHdGsuV2lkZ2V0LkNvbnN0cnVjdG9yUHJvcHMsXG4gICAgU2lnbmFscyBleHRlbmRzIFJlY29yZDxgb24ke3N0cmluZ31gLCBBcnJheTx1bmtub3duPj4gPSBSZWNvcmQ8YG9uJHtzdHJpbmd9YCwgYW55W10+LFxuPiA9IFBhcnRpYWw8e1xuICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgY2FuJ3QgYXNzaWduIHRvIHVua25vd24sIGJ1dCBpdCB3b3JrcyBhcyBleHBlY3RlZCB0aG91Z2hcbiAgICBbUyBpbiBrZXlvZiBTaWduYWxzXTogU2lnSGFuZGxlcjxTZWxmLCBTaWduYWxzW1NdPlxufT4gJiBQYXJ0aWFsPHtcbiAgICBbS2V5IGluIGBvbiR7c3RyaW5nfWBdOiBTaWdIYW5kbGVyPFNlbGYsIGFueVtdPlxufT4gJiBQYXJ0aWFsPEJpbmRhYmxlUHJvcHM8T21pdDxQcm9wcywgXCJjc3NOYW1lXCIgfCBcImNzc19uYW1lXCI+Pj4gJiB7XG4gICAgbm9JbXBsaWNpdERlc3Ryb3k/OiB0cnVlXG4gICAgdHlwZT86IHN0cmluZ1xuICAgIGNzc05hbWU/OiBzdHJpbmdcbn0gJiBFdmVudENvbnRyb2xsZXI8U2VsZj4gJiB7XG4gICAgb25EZXN0cm95PzogKHNlbGY6IFNlbGYpID0+IHVua25vd25cbiAgICBzZXR1cD86IChzZWxmOiBTZWxmKSA9PiB2b2lkXG59XG5cbnR5cGUgRXZlbnRDb250cm9sbGVyPFNlbGYgZXh0ZW5kcyBHdGsuV2lkZ2V0PiA9IHtcbiAgICBvbkZvY3VzRW50ZXI/OiAoc2VsZjogU2VsZikgPT4gdm9pZFxuICAgIG9uRm9jdXNMZWF2ZT86IChzZWxmOiBTZWxmKSA9PiB2b2lkXG5cbiAgICBvbktleVByZXNzZWQ/OiAoc2VsZjogU2VsZiwga2V5dmFsOiBudW1iZXIsIGtleWNvZGU6IG51bWJlciwgc3RhdGU6IEdkay5Nb2RpZmllclR5cGUpID0+IHZvaWRcbiAgICBvbktleVJlbGVhc2VkPzogKHNlbGY6IFNlbGYsIGtleXZhbDogbnVtYmVyLCBrZXljb2RlOiBudW1iZXIsIHN0YXRlOiBHZGsuTW9kaWZpZXJUeXBlKSA9PiB2b2lkXG4gICAgb25LZXlNb2RpZmllcj86IChzZWxmOiBTZWxmLCBzdGF0ZTogR2RrLk1vZGlmaWVyVHlwZSkgPT4gdm9pZFxuXG4gICAgb25MZWdhY3k/OiAoc2VsZjogU2VsZiwgZXZlbnQ6IEdkay5FdmVudCkgPT4gdm9pZFxuICAgIG9uQnV0dG9uUHJlc3NlZD86IChzZWxmOiBTZWxmLCBzdGF0ZTogR2RrLkJ1dHRvbkV2ZW50KSA9PiB2b2lkXG4gICAgb25CdXR0b25SZWxlYXNlZD86IChzZWxmOiBTZWxmLCBzdGF0ZTogR2RrLkJ1dHRvbkV2ZW50KSA9PiB2b2lkXG5cbiAgICBvbkhvdmVyRW50ZXI/OiAoc2VsZjogU2VsZiwgeDogbnVtYmVyLCB5OiBudW1iZXIpID0+IHZvaWRcbiAgICBvbkhvdmVyTGVhdmU/OiAoc2VsZjogU2VsZikgPT4gdm9pZFxuICAgIG9uTW90aW9uPzogKHNlbGY6IFNlbGYsIHg6IG51bWJlciwgeTogbnVtYmVyKSA9PiB2b2lkXG5cbiAgICBvblNjcm9sbD86IChzZWxmOiBTZWxmLCBkeDogbnVtYmVyLCBkeTogbnVtYmVyKSA9PiB2b2lkXG4gICAgb25TY3JvbGxEZWNlbGVyYXRlPzogKHNlbGY6IFNlbGYsIHZlbF94OiBudW1iZXIsIHZlbF95OiBudW1iZXIpID0+IHZvaWRcbn1cblxuZnVuY3Rpb24gc2V0dXBDb250cm9sbGVyczxUPih3aWRnZXQ6IEd0ay5XaWRnZXQsIHtcbiAgICBvbkZvY3VzRW50ZXIsXG4gICAgb25Gb2N1c0xlYXZlLFxuICAgIG9uS2V5UHJlc3NlZCxcbiAgICBvbktleVJlbGVhc2VkLFxuICAgIG9uS2V5TW9kaWZpZXIsXG4gICAgb25MZWdhY3ksXG4gICAgb25CdXR0b25QcmVzc2VkLFxuICAgIG9uQnV0dG9uUmVsZWFzZWQsXG4gICAgb25Ib3ZlckVudGVyLFxuICAgIG9uSG92ZXJMZWF2ZSxcbiAgICBvbk1vdGlvbixcbiAgICBvblNjcm9sbCxcbiAgICBvblNjcm9sbERlY2VsZXJhdGUsXG4gICAgLi4ucHJvcHNcbn06IEV2ZW50Q29udHJvbGxlcjxHdGsuV2lkZ2V0PiAmIFQpIHtcbiAgICBpZiAob25Gb2N1c0VudGVyIHx8IG9uRm9jdXNMZWF2ZSkge1xuICAgICAgICBjb25zdCBmb2N1cyA9IG5ldyBHdGsuRXZlbnRDb250cm9sbGVyRm9jdXNcbiAgICAgICAgd2lkZ2V0LmFkZF9jb250cm9sbGVyKGZvY3VzKVxuXG4gICAgICAgIGlmIChvbkZvY3VzRW50ZXIpXG4gICAgICAgICAgICBmb2N1cy5jb25uZWN0KFwiZW50ZXJcIiwgKCkgPT4gb25Gb2N1c0VudGVyKHdpZGdldCkpXG5cbiAgICAgICAgaWYgKG9uRm9jdXNMZWF2ZSlcbiAgICAgICAgICAgIGZvY3VzLmNvbm5lY3QoXCJsZWF2ZVwiLCAoKSA9PiBvbkZvY3VzTGVhdmUod2lkZ2V0KSlcbiAgICB9XG5cbiAgICBpZiAob25LZXlQcmVzc2VkIHx8IG9uS2V5UmVsZWFzZWQgfHwgb25LZXlNb2RpZmllcikge1xuICAgICAgICBjb25zdCBrZXkgPSBuZXcgR3RrLkV2ZW50Q29udHJvbGxlcktleVxuICAgICAgICB3aWRnZXQuYWRkX2NvbnRyb2xsZXIoa2V5KVxuXG4gICAgICAgIGlmIChvbktleVByZXNzZWQpXG4gICAgICAgICAgICBrZXkuY29ubmVjdChcImtleS1wcmVzc2VkXCIsIChfLCB2YWwsIGNvZGUsIHN0YXRlKSA9PiBvbktleVByZXNzZWQod2lkZ2V0LCB2YWwsIGNvZGUsIHN0YXRlKSlcblxuICAgICAgICBpZiAob25LZXlSZWxlYXNlZClcbiAgICAgICAgICAgIGtleS5jb25uZWN0KFwia2V5LXJlbGVhc2VkXCIsIChfLCB2YWwsIGNvZGUsIHN0YXRlKSA9PiBvbktleVJlbGVhc2VkKHdpZGdldCwgdmFsLCBjb2RlLCBzdGF0ZSkpXG5cbiAgICAgICAgaWYgKG9uS2V5TW9kaWZpZXIpXG4gICAgICAgICAgICBrZXkuY29ubmVjdChcIm1vZGlmaWVyc1wiLCAoXywgc3RhdGUpID0+IG9uS2V5TW9kaWZpZXIod2lkZ2V0LCBzdGF0ZSkpXG4gICAgfVxuXG4gICAgaWYgKG9uTGVnYWN5IHx8IG9uQnV0dG9uUHJlc3NlZCB8fCBvbkJ1dHRvblJlbGVhc2VkKSB7XG4gICAgICAgIGNvbnN0IGxlZ2FjeSA9IG5ldyBHdGsuRXZlbnRDb250cm9sbGVyTGVnYWN5XG4gICAgICAgIHdpZGdldC5hZGRfY29udHJvbGxlcihsZWdhY3kpXG5cbiAgICAgICAgbGVnYWN5LmNvbm5lY3QoXCJldmVudFwiLCAoXywgZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGlmIChldmVudC5nZXRfZXZlbnRfdHlwZSgpID09PSBHZGsuRXZlbnRUeXBlLkJVVFRPTl9QUkVTUykge1xuICAgICAgICAgICAgICAgIG9uQnV0dG9uUHJlc3NlZD8uKHdpZGdldCwgZXZlbnQgYXMgR2RrLkJ1dHRvbkV2ZW50KVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZXZlbnQuZ2V0X2V2ZW50X3R5cGUoKSA9PT0gR2RrLkV2ZW50VHlwZS5CVVRUT05fUkVMRUFTRSkge1xuICAgICAgICAgICAgICAgIG9uQnV0dG9uUmVsZWFzZWQ/Lih3aWRnZXQsIGV2ZW50IGFzIEdkay5CdXR0b25FdmVudClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb25MZWdhY3k/Lih3aWRnZXQsIGV2ZW50KVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGlmIChvbk1vdGlvbiB8fCBvbkhvdmVyRW50ZXIgfHwgb25Ib3ZlckxlYXZlKSB7XG4gICAgICAgIGNvbnN0IGhvdmVyID0gbmV3IEd0ay5FdmVudENvbnRyb2xsZXJNb3Rpb25cbiAgICAgICAgd2lkZ2V0LmFkZF9jb250cm9sbGVyKGhvdmVyKVxuXG4gICAgICAgIGlmIChvbkhvdmVyRW50ZXIpXG4gICAgICAgICAgICBob3Zlci5jb25uZWN0KFwiZW50ZXJcIiwgKF8sIHgsIHkpID0+IG9uSG92ZXJFbnRlcih3aWRnZXQsIHgsIHkpKVxuXG4gICAgICAgIGlmIChvbkhvdmVyTGVhdmUpXG4gICAgICAgICAgICBob3Zlci5jb25uZWN0KFwibGVhdmVcIiwgKCkgPT4gb25Ib3ZlckxlYXZlKHdpZGdldCkpXG5cbiAgICAgICAgaWYgKG9uTW90aW9uKVxuICAgICAgICAgICAgaG92ZXIuY29ubmVjdChcIm1vdGlvblwiLCAoXywgeCwgeSkgPT4gb25Nb3Rpb24od2lkZ2V0LCB4LCB5KSlcbiAgICB9XG5cbiAgICBpZiAob25TY3JvbGwgfHwgb25TY3JvbGxEZWNlbGVyYXRlKSB7XG4gICAgICAgIGNvbnN0IHNjcm9sbCA9IG5ldyBHdGsuRXZlbnRDb250cm9sbGVyU2Nyb2xsXG4gICAgICAgIHNjcm9sbC5mbGFncyA9IEd0ay5FdmVudENvbnRyb2xsZXJTY3JvbGxGbGFncy5CT1RIX0FYRVMgfCBHdGsuRXZlbnRDb250cm9sbGVyU2Nyb2xsRmxhZ3MuS0lORVRJQ1xuICAgICAgICB3aWRnZXQuYWRkX2NvbnRyb2xsZXIoc2Nyb2xsKVxuXG4gICAgICAgIGlmIChvblNjcm9sbClcbiAgICAgICAgICAgIHNjcm9sbC5jb25uZWN0KFwic2Nyb2xsXCIsIChfLCB4LCB5KSA9PiBvblNjcm9sbCh3aWRnZXQsIHgsIHkpKVxuXG4gICAgICAgIGlmIChvblNjcm9sbERlY2VsZXJhdGUpXG4gICAgICAgICAgICBzY3JvbGwuY29ubmVjdChcImRlY2VsZXJhdGVcIiwgKF8sIHgsIHkpID0+IG9uU2Nyb2xsRGVjZWxlcmF0ZSh3aWRnZXQsIHgsIHkpKVxuICAgIH1cblxuICAgIHJldHVybiBwcm9wc1xufVxuIiwgImltcG9ydCBHTGliIGZyb20gXCJnaTovL0dMaWI/dmVyc2lvbj0yLjBcIlxuaW1wb3J0IEd0ayBmcm9tIFwiZ2k6Ly9HdGs/dmVyc2lvbj00LjBcIlxuaW1wb3J0IEFzdGFsIGZyb20gXCJnaTovL0FzdGFsP3ZlcnNpb249NC4wXCJcbmltcG9ydCB7IG1rQXBwIH0gZnJvbSBcIi4uL19hcHBcIlxuXG5HdGsuaW5pdCgpXG5cbi8vIHN0b3AgdGhpcyBmcm9tIGxlYWtpbmcgaW50byBzdWJwcm9jZXNzZXNcbi8vIGFuZCBnaW8gbGF1bmNoIGludm9jYXRpb25zXG5HTGliLnVuc2V0ZW52KFwiTERfUFJFTE9BRFwiKVxuXG4vLyB1c2VycyBtaWdodCB3YW50IHRvIHVzZSBBZHdhaXRhIGluIHdoaWNoIGNhc2UgaXQgaGFzIHRvIGJlIGluaXRpYWxpemVkXG4vLyBpdCBtaWdodCBiZSBjb21tb24gcGl0ZmFsbCB0byBmb3JnZXQgaXQgYmVjYXVzZSBgQXBwYCBpcyBub3QgYEFkdy5BcHBsaWNhdGlvbmBcbmF3YWl0IGltcG9ydChcImdpOi8vQWR3P3ZlcnNpb249MVwiKVxuICAgIC50aGVuKCh7IGRlZmF1bHQ6IEFkdyB9KSA9PiBBZHcuaW5pdCgpKVxuICAgIC5jYXRjaCgoKSA9PiB2b2lkIDApXG5cbmV4cG9ydCBkZWZhdWx0IG1rQXBwKEFzdGFsLkFwcGxpY2F0aW9uKVxuIiwgIi8qKlxuICogV29ya2Fyb3VuZCBmb3IgXCJDYW4ndCBjb252ZXJ0IG5vbi1udWxsIHBvaW50ZXIgdG8gSlMgdmFsdWUgXCJcbiAqL1xuXG5leHBvcnQgeyB9XG5cbmNvbnN0IHNuYWtlaWZ5ID0gKHN0cjogc3RyaW5nKSA9PiBzdHJcbiAgICAucmVwbGFjZSgvKFthLXpdKShbQS1aXSkvZywgXCIkMV8kMlwiKVxuICAgIC5yZXBsYWNlQWxsKFwiLVwiLCBcIl9cIilcbiAgICAudG9Mb3dlckNhc2UoKVxuXG5hc3luYyBmdW5jdGlvbiBzdXBwcmVzczxUPihtb2Q6IFByb21pc2U8eyBkZWZhdWx0OiBUIH0+LCBwYXRjaDogKG06IFQpID0+IHZvaWQpIHtcbiAgICByZXR1cm4gbW9kLnRoZW4obSA9PiBwYXRjaChtLmRlZmF1bHQpKS5jYXRjaCgoKSA9PiB2b2lkIDApXG59XG5cbmZ1bmN0aW9uIHBhdGNoPFAgZXh0ZW5kcyBvYmplY3Q+KHByb3RvOiBQLCBwcm9wOiBFeHRyYWN0PGtleW9mIFAsIHN0cmluZz4pIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sIHByb3AsIHtcbiAgICAgICAgZ2V0KCkgeyByZXR1cm4gdGhpc1tgZ2V0XyR7c25ha2VpZnkocHJvcCl9YF0oKSB9LFxuICAgIH0pXG59XG5cbmF3YWl0IHN1cHByZXNzKGltcG9ydChcImdpOi8vQXN0YWxBcHBzXCIpLCAoeyBBcHBzLCBBcHBsaWNhdGlvbiB9KSA9PiB7XG4gICAgcGF0Y2goQXBwcy5wcm90b3R5cGUsIFwibGlzdFwiKVxuICAgIHBhdGNoKEFwcGxpY2F0aW9uLnByb3RvdHlwZSwgXCJrZXl3b3Jkc1wiKVxuICAgIHBhdGNoKEFwcGxpY2F0aW9uLnByb3RvdHlwZSwgXCJjYXRlZ29yaWVzXCIpXG59KVxuXG5hd2FpdCBzdXBwcmVzcyhpbXBvcnQoXCJnaTovL0FzdGFsQmF0dGVyeVwiKSwgKHsgVVBvd2VyIH0pID0+IHtcbiAgICBwYXRjaChVUG93ZXIucHJvdG90eXBlLCBcImRldmljZXNcIilcbn0pXG5cbmF3YWl0IHN1cHByZXNzKGltcG9ydChcImdpOi8vQXN0YWxCbHVldG9vdGhcIiksICh7IEFkYXB0ZXIsIEJsdWV0b290aCwgRGV2aWNlIH0pID0+IHtcbiAgICBwYXRjaChBZGFwdGVyLnByb3RvdHlwZSwgXCJ1dWlkc1wiKVxuICAgIHBhdGNoKEJsdWV0b290aC5wcm90b3R5cGUsIFwiYWRhcHRlcnNcIilcbiAgICBwYXRjaChCbHVldG9vdGgucHJvdG90eXBlLCBcImRldmljZXNcIilcbiAgICBwYXRjaChEZXZpY2UucHJvdG90eXBlLCBcInV1aWRzXCIpXG59KVxuXG5hd2FpdCBzdXBwcmVzcyhpbXBvcnQoXCJnaTovL0FzdGFsSHlwcmxhbmRcIiksICh7IEh5cHJsYW5kLCBNb25pdG9yLCBXb3Jrc3BhY2UgfSkgPT4ge1xuICAgIHBhdGNoKEh5cHJsYW5kLnByb3RvdHlwZSwgXCJiaW5kc1wiKVxuICAgIHBhdGNoKEh5cHJsYW5kLnByb3RvdHlwZSwgXCJtb25pdG9yc1wiKVxuICAgIHBhdGNoKEh5cHJsYW5kLnByb3RvdHlwZSwgXCJ3b3Jrc3BhY2VzXCIpXG4gICAgcGF0Y2goSHlwcmxhbmQucHJvdG90eXBlLCBcImNsaWVudHNcIilcbiAgICBwYXRjaChNb25pdG9yLnByb3RvdHlwZSwgXCJhdmFpbGFibGVNb2Rlc1wiKVxuICAgIHBhdGNoKE1vbml0b3IucHJvdG90eXBlLCBcImF2YWlsYWJsZV9tb2Rlc1wiKVxuICAgIHBhdGNoKFdvcmtzcGFjZS5wcm90b3R5cGUsIFwiY2xpZW50c1wiKVxufSlcblxuYXdhaXQgc3VwcHJlc3MoaW1wb3J0KFwiZ2k6Ly9Bc3RhbE1wcmlzXCIpLCAoeyBNcHJpcywgUGxheWVyIH0pID0+IHtcbiAgICBwYXRjaChNcHJpcy5wcm90b3R5cGUsIFwicGxheWVyc1wiKVxuICAgIHBhdGNoKFBsYXllci5wcm90b3R5cGUsIFwic3VwcG9ydGVkX3VyaV9zY2hlbWVzXCIpXG4gICAgcGF0Y2goUGxheWVyLnByb3RvdHlwZSwgXCJzdXBwb3J0ZWRVcmlTY2hlbWVzXCIpXG4gICAgcGF0Y2goUGxheWVyLnByb3RvdHlwZSwgXCJzdXBwb3J0ZWRfbWltZV90eXBlc1wiKVxuICAgIHBhdGNoKFBsYXllci5wcm90b3R5cGUsIFwic3VwcG9ydGVkTWltZVR5cGVzXCIpXG4gICAgcGF0Y2goUGxheWVyLnByb3RvdHlwZSwgXCJjb21tZW50c1wiKVxufSlcblxuYXdhaXQgc3VwcHJlc3MoaW1wb3J0KFwiZ2k6Ly9Bc3RhbE5ldHdvcmtcIiksICh7IFdpZmkgfSkgPT4ge1xuICAgIHBhdGNoKFdpZmkucHJvdG90eXBlLCBcImFjY2Vzc19wb2ludHNcIilcbiAgICBwYXRjaChXaWZpLnByb3RvdHlwZSwgXCJhY2Nlc3NQb2ludHNcIilcbn0pXG5cbmF3YWl0IHN1cHByZXNzKGltcG9ydChcImdpOi8vQXN0YWxOb3RpZmRcIiksICh7IE5vdGlmZCwgTm90aWZpY2F0aW9uIH0pID0+IHtcbiAgICBwYXRjaChOb3RpZmQucHJvdG90eXBlLCBcIm5vdGlmaWNhdGlvbnNcIilcbiAgICBwYXRjaChOb3RpZmljYXRpb24ucHJvdG90eXBlLCBcImFjdGlvbnNcIilcbn0pXG5cbmF3YWl0IHN1cHByZXNzKGltcG9ydChcImdpOi8vQXN0YWxQb3dlclByb2ZpbGVzXCIpLCAoeyBQb3dlclByb2ZpbGVzIH0pID0+IHtcbiAgICBwYXRjaChQb3dlclByb2ZpbGVzLnByb3RvdHlwZSwgXCJhY3Rpb25zXCIpXG59KVxuXG5hd2FpdCBzdXBwcmVzcyhpbXBvcnQoXCJnaTovL0FzdGFsV3BcIiksICh7IFdwLCBBdWRpbywgVmlkZW8gfSkgPT4ge1xuICAgIHBhdGNoKFdwLnByb3RvdHlwZSwgXCJlbmRwb2ludHNcIilcbiAgICBwYXRjaChXcC5wcm90b3R5cGUsIFwiZGV2aWNlc1wiKVxuICAgIHBhdGNoKEF1ZGlvLnByb3RvdHlwZSwgXCJzdHJlYW1zXCIpXG4gICAgcGF0Y2goQXVkaW8ucHJvdG90eXBlLCBcInJlY29yZGVyc1wiKVxuICAgIHBhdGNoKEF1ZGlvLnByb3RvdHlwZSwgXCJtaWNyb3Bob25lc1wiKVxuICAgIHBhdGNoKEF1ZGlvLnByb3RvdHlwZSwgXCJzcGVha2Vyc1wiKVxuICAgIHBhdGNoKEF1ZGlvLnByb3RvdHlwZSwgXCJkZXZpY2VzXCIpXG4gICAgcGF0Y2goVmlkZW8ucHJvdG90eXBlLCBcInN0cmVhbXNcIilcbiAgICBwYXRjaChWaWRlby5wcm90b3R5cGUsIFwicmVjb3JkZXJzXCIpXG4gICAgcGF0Y2goVmlkZW8ucHJvdG90eXBlLCBcInNpbmtzXCIpXG4gICAgcGF0Y2goVmlkZW8ucHJvdG90eXBlLCBcInNvdXJjZXNcIilcbiAgICBwYXRjaChWaWRlby5wcm90b3R5cGUsIFwiZGV2aWNlc1wiKVxufSlcbiIsICJpbXBvcnQgXCIuL292ZXJyaWRlcy5qc1wiXG5pbXBvcnQgeyBzZXRDb25zb2xlTG9nRG9tYWluIH0gZnJvbSBcImNvbnNvbGVcIlxuaW1wb3J0IHsgZXhpdCwgcHJvZ3JhbUFyZ3MgfSBmcm9tIFwic3lzdGVtXCJcbmltcG9ydCBJTyBmcm9tIFwiZ2k6Ly9Bc3RhbElPXCJcbmltcG9ydCBHT2JqZWN0IGZyb20gXCJnaTovL0dPYmplY3RcIlxuaW1wb3J0IEdpbyBmcm9tIFwiZ2k6Ly9HaW8/dmVyc2lvbj0yLjBcIlxuaW1wb3J0IHR5cGUgQXN0YWwzIGZyb20gXCJnaTovL0FzdGFsP3ZlcnNpb249My4wXCJcbmltcG9ydCB0eXBlIEFzdGFsNCBmcm9tIFwiZ2k6Ly9Bc3RhbD92ZXJzaW9uPTQuMFwiXG5cbnR5cGUgQ29uZmlnID0gUGFydGlhbDx7XG4gICAgaW5zdGFuY2VOYW1lOiBzdHJpbmdcbiAgICBjc3M6IHN0cmluZ1xuICAgIGljb25zOiBzdHJpbmdcbiAgICBndGtUaGVtZTogc3RyaW5nXG4gICAgaWNvblRoZW1lOiBzdHJpbmdcbiAgICBjdXJzb3JUaGVtZTogc3RyaW5nXG4gICAgaG9sZDogYm9vbGVhblxuICAgIHJlcXVlc3RIYW5kbGVyKHJlcXVlc3Q6IHN0cmluZywgcmVzOiAocmVzcG9uc2U6IGFueSkgPT4gdm9pZCk6IHZvaWRcbiAgICBtYWluKC4uLmFyZ3M6IHN0cmluZ1tdKTogdm9pZFxuICAgIGNsaWVudChtZXNzYWdlOiAobXNnOiBzdHJpbmcpID0+IHN0cmluZywgLi4uYXJnczogc3RyaW5nW10pOiB2b2lkXG59PlxuXG5pbnRlcmZhY2UgQXN0YWwzSlMgZXh0ZW5kcyBBc3RhbDMuQXBwbGljYXRpb24ge1xuICAgIGV2YWwoYm9keTogc3RyaW5nKTogUHJvbWlzZTxhbnk+XG4gICAgcmVxdWVzdEhhbmRsZXI6IENvbmZpZ1tcInJlcXVlc3RIYW5kbGVyXCJdXG4gICAgYXBwbHlfY3NzKHN0eWxlOiBzdHJpbmcsIHJlc2V0PzogYm9vbGVhbik6IHZvaWRcbiAgICBxdWl0KGNvZGU/OiBudW1iZXIpOiB2b2lkXG4gICAgc3RhcnQoY29uZmlnPzogQ29uZmlnKTogdm9pZFxufVxuXG5pbnRlcmZhY2UgQXN0YWw0SlMgZXh0ZW5kcyBBc3RhbDQuQXBwbGljYXRpb24ge1xuICAgIGV2YWwoYm9keTogc3RyaW5nKTogUHJvbWlzZTxhbnk+XG4gICAgcmVxdWVzdEhhbmRsZXI/OiBDb25maWdbXCJyZXF1ZXN0SGFuZGxlclwiXVxuICAgIGFwcGx5X2NzcyhzdHlsZTogc3RyaW5nLCByZXNldD86IGJvb2xlYW4pOiB2b2lkXG4gICAgcXVpdChjb2RlPzogbnVtYmVyKTogdm9pZFxuICAgIHN0YXJ0KGNvbmZpZz86IENvbmZpZyk6IHZvaWRcbn1cblxudHlwZSBBcHAzID0gdHlwZW9mIEFzdGFsMy5BcHBsaWNhdGlvblxudHlwZSBBcHA0ID0gdHlwZW9mIEFzdGFsNC5BcHBsaWNhdGlvblxuXG5leHBvcnQgZnVuY3Rpb24gbWtBcHA8QXBwIGV4dGVuZHMgQXBwMz4oQXBwOiBBcHApOiBBc3RhbDNKU1xuZXhwb3J0IGZ1bmN0aW9uIG1rQXBwPEFwcCBleHRlbmRzIEFwcDQ+KEFwcDogQXBwKTogQXN0YWw0SlNcblxuZXhwb3J0IGZ1bmN0aW9uIG1rQXBwKEFwcDogQXBwMyB8IEFwcDQpIHtcbiAgICByZXR1cm4gbmV3IChjbGFzcyBBc3RhbEpTIGV4dGVuZHMgQXBwIHtcbiAgICAgICAgc3RhdGljIHsgR09iamVjdC5yZWdpc3RlckNsYXNzKHsgR1R5cGVOYW1lOiBcIkFzdGFsSlNcIiB9LCB0aGlzIGFzIGFueSkgfVxuXG4gICAgICAgIGV2YWwoYm9keTogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmbiA9IEZ1bmN0aW9uKGByZXR1cm4gKGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHtib2R5LmluY2x1ZGVzKFwiO1wiKSA/IGJvZHkgOiBgcmV0dXJuICR7Ym9keX07YH1cbiAgICAgICAgICAgICAgICAgICAgfSlgKVxuICAgICAgICAgICAgICAgICAgICBmbigpKCkudGhlbihyZXMpLmNhdGNoKHJlailcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICByZWooZXJyb3IpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIHJlcXVlc3RIYW5kbGVyPzogQ29uZmlnW1wicmVxdWVzdEhhbmRsZXJcIl1cblxuICAgICAgICB2ZnVuY19yZXF1ZXN0KG1zZzogc3RyaW5nLCBjb25uOiBHaW8uU29ja2V0Q29ubmVjdGlvbik6IHZvaWQge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnJlcXVlc3RIYW5kbGVyID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3RIYW5kbGVyKG1zZywgKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIElPLndyaXRlX3NvY2soY29ubiwgU3RyaW5nKHJlc3BvbnNlKSwgKF8sIHJlcykgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIElPLndyaXRlX3NvY2tfZmluaXNoKHJlcyksXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzdXBlci52ZnVuY19yZXF1ZXN0KG1zZywgY29ubilcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGFwcGx5X2NzcyhzdHlsZTogc3RyaW5nLCByZXNldCA9IGZhbHNlKSB7XG4gICAgICAgICAgICBzdXBlci5hcHBseV9jc3Moc3R5bGUsIHJlc2V0KVxuICAgICAgICB9XG5cbiAgICAgICAgcXVpdChjb2RlPzogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgICAgICBzdXBlci5xdWl0KClcbiAgICAgICAgICAgIGV4aXQoY29kZSA/PyAwKVxuICAgICAgICB9XG5cbiAgICAgICAgc3RhcnQoeyByZXF1ZXN0SGFuZGxlciwgY3NzLCBob2xkLCBtYWluLCBjbGllbnQsIGljb25zLCAuLi5jZmcgfTogQ29uZmlnID0ge30pIHtcbiAgICAgICAgICAgIGNvbnN0IGFwcCA9IHRoaXMgYXMgdW5rbm93biBhcyBJbnN0YW5jZVR5cGU8QXBwMyB8IEFwcDQ+XG5cbiAgICAgICAgICAgIGNsaWVudCA/Pz0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHByaW50KGBBc3RhbCBpbnN0YW5jZSBcIiR7YXBwLmluc3RhbmNlTmFtZX1cIiBhbHJlYWR5IHJ1bm5pbmdgKVxuICAgICAgICAgICAgICAgIGV4aXQoMSlcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLCBjZmcpXG4gICAgICAgICAgICBzZXRDb25zb2xlTG9nRG9tYWluKGFwcC5pbnN0YW5jZU5hbWUpXG5cbiAgICAgICAgICAgIHRoaXMucmVxdWVzdEhhbmRsZXIgPSByZXF1ZXN0SGFuZGxlclxuICAgICAgICAgICAgYXBwLmNvbm5lY3QoXCJhY3RpdmF0ZVwiLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgbWFpbj8uKC4uLnByb2dyYW1BcmdzKVxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhcHAuYWNxdWlyZV9zb2NrZXQoKVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2xpZW50KG1zZyA9PiBJTy5zZW5kX3JlcXVlc3QoYXBwLmluc3RhbmNlTmFtZSwgbXNnKSEsIC4uLnByb2dyYW1BcmdzKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoY3NzKVxuICAgICAgICAgICAgICAgIHRoaXMuYXBwbHlfY3NzKGNzcywgZmFsc2UpXG5cbiAgICAgICAgICAgIGlmIChpY29ucylcbiAgICAgICAgICAgICAgICBhcHAuYWRkX2ljb25zKGljb25zKVxuXG4gICAgICAgICAgICBob2xkID8/PSB0cnVlXG4gICAgICAgICAgICBpZiAoaG9sZClcbiAgICAgICAgICAgICAgICBhcHAuaG9sZCgpXG5cbiAgICAgICAgICAgIGFwcC5ydW5Bc3luYyhbXSlcbiAgICAgICAgfVxuICAgIH0pXG59XG4iLCAiaW1wb3J0IEFzdGFsIGZyb20gXCJnaTovL0FzdGFsP3ZlcnNpb249NC4wXCJcbmltcG9ydCBHdGsgZnJvbSBcImdpOi8vR3RrP3ZlcnNpb249NC4wXCJcbmltcG9ydCBhc3RhbGlmeSwgeyB0eXBlLCB0eXBlIENvbnN0cnVjdFByb3BzIH0gZnJvbSBcIi4vYXN0YWxpZnkuanNcIlxuXG5mdW5jdGlvbiBmaWx0ZXIoY2hpbGRyZW46IGFueVtdKSB7XG4gICAgcmV0dXJuIGNoaWxkcmVuLmZsYXQoSW5maW5pdHkpLm1hcChjaCA9PiBjaCBpbnN0YW5jZW9mIEd0ay5XaWRnZXRcbiAgICAgICAgPyBjaFxuICAgICAgICA6IG5ldyBHdGsuTGFiZWwoeyB2aXNpYmxlOiB0cnVlLCBsYWJlbDogU3RyaW5nKGNoKSB9KSlcbn1cblxuLy8gQm94XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoQXN0YWwuQm94LnByb3RvdHlwZSwgXCJjaGlsZHJlblwiLCB7XG4gICAgZ2V0KCkgeyByZXR1cm4gdGhpcy5nZXRfY2hpbGRyZW4oKSB9LFxuICAgIHNldCh2KSB7IHRoaXMuc2V0X2NoaWxkcmVuKHYpIH0sXG59KVxuXG5leHBvcnQgdHlwZSBCb3hQcm9wcyA9IENvbnN0cnVjdFByb3BzPEFzdGFsLkJveCwgQXN0YWwuQm94LkNvbnN0cnVjdG9yUHJvcHM+XG5leHBvcnQgY29uc3QgQm94ID0gYXN0YWxpZnk8QXN0YWwuQm94LCBBc3RhbC5Cb3guQ29uc3RydWN0b3JQcm9wcz4oQXN0YWwuQm94LCB7XG4gICAgZ2V0Q2hpbGRyZW4oc2VsZikgeyByZXR1cm4gc2VsZi5nZXRfY2hpbGRyZW4oKSB9LFxuICAgIHNldENoaWxkcmVuKHNlbGYsIGNoaWxkcmVuKSB7IHJldHVybiBzZWxmLnNldF9jaGlsZHJlbihmaWx0ZXIoY2hpbGRyZW4pKSB9LFxufSlcblxuLy8gQnV0dG9uXG50eXBlIEJ1dHRvblNpZ25hbHMgPSB7XG4gICAgb25DbGlja2VkOiBbXVxufVxuXG5leHBvcnQgdHlwZSBCdXR0b25Qcm9wcyA9IENvbnN0cnVjdFByb3BzPEd0ay5CdXR0b24sIEd0ay5CdXR0b24uQ29uc3RydWN0b3JQcm9wcywgQnV0dG9uU2lnbmFscz5cbmV4cG9ydCBjb25zdCBCdXR0b24gPSBhc3RhbGlmeTxHdGsuQnV0dG9uLCBHdGsuQnV0dG9uLkNvbnN0cnVjdG9yUHJvcHMsIEJ1dHRvblNpZ25hbHM+KEd0ay5CdXR0b24pXG5cbi8vIENlbnRlckJveFxuZXhwb3J0IHR5cGUgQ2VudGVyQm94UHJvcHMgPSBDb25zdHJ1Y3RQcm9wczxHdGsuQ2VudGVyQm94LCBHdGsuQ2VudGVyQm94LkNvbnN0cnVjdG9yUHJvcHM+XG5leHBvcnQgY29uc3QgQ2VudGVyQm94ID0gYXN0YWxpZnk8R3RrLkNlbnRlckJveCwgR3RrLkNlbnRlckJveC5Db25zdHJ1Y3RvclByb3BzPihHdGsuQ2VudGVyQm94LCB7XG4gICAgZ2V0Q2hpbGRyZW4oYm94KSB7XG4gICAgICAgIHJldHVybiBbYm94LnN0YXJ0V2lkZ2V0LCBib3guY2VudGVyV2lkZ2V0LCBib3guZW5kV2lkZ2V0XVxuICAgIH0sXG4gICAgc2V0Q2hpbGRyZW4oYm94LCBjaGlsZHJlbikge1xuICAgICAgICBjb25zdCBjaCA9IGZpbHRlcihjaGlsZHJlbilcbiAgICAgICAgYm94LnN0YXJ0V2lkZ2V0ID0gY2hbMF0gfHwgbmV3IEd0ay5Cb3hcbiAgICAgICAgYm94LmNlbnRlcldpZGdldCA9IGNoWzFdIHx8IG5ldyBHdGsuQm94XG4gICAgICAgIGJveC5lbmRXaWRnZXQgPSBjaFsyXSB8fCBuZXcgR3RrLkJveFxuICAgIH0sXG59KVxuXG4vLyBUT0RPOiBDaXJjdWxhclByb2dyZXNzXG4vLyBUT0RPOiBEcmF3aW5nQXJlYVxuXG4vLyBFbnRyeVxudHlwZSBFbnRyeVNpZ25hbHMgPSB7XG4gICAgb25BY3RpdmF0ZTogW11cbiAgICBvbk5vdGlmeVRleHQ6IFtdXG59XG5cbmV4cG9ydCB0eXBlIEVudHJ5UHJvcHMgPSBDb25zdHJ1Y3RQcm9wczxHdGsuRW50cnksIEd0ay5FbnRyeS5Db25zdHJ1Y3RvclByb3BzLCBFbnRyeVNpZ25hbHM+XG5leHBvcnQgY29uc3QgRW50cnkgPSBhc3RhbGlmeTxHdGsuRW50cnksIEd0ay5FbnRyeS5Db25zdHJ1Y3RvclByb3BzLCBFbnRyeVNpZ25hbHM+KEd0ay5FbnRyeSwge1xuICAgIGdldENoaWxkcmVuKCkgeyByZXR1cm4gW10gfSxcbn0pXG5cbi8vIEltYWdlXG5leHBvcnQgdHlwZSBJbWFnZVByb3BzID0gQ29uc3RydWN0UHJvcHM8R3RrLkltYWdlLCBHdGsuSW1hZ2UuQ29uc3RydWN0b3JQcm9wcz5cbmV4cG9ydCBjb25zdCBJbWFnZSA9IGFzdGFsaWZ5PEd0ay5JbWFnZSwgR3RrLkltYWdlLkNvbnN0cnVjdG9yUHJvcHM+KEd0ay5JbWFnZSwge1xuICAgIGdldENoaWxkcmVuKCkgeyByZXR1cm4gW10gfSxcbn0pXG5cbi8vIExhYmVsXG5leHBvcnQgdHlwZSBMYWJlbFByb3BzID0gQ29uc3RydWN0UHJvcHM8R3RrLkxhYmVsLCBHdGsuTGFiZWwuQ29uc3RydWN0b3JQcm9wcz5cbmV4cG9ydCBjb25zdCBMYWJlbCA9IGFzdGFsaWZ5PEd0ay5MYWJlbCwgR3RrLkxhYmVsLkNvbnN0cnVjdG9yUHJvcHM+KEd0ay5MYWJlbCwge1xuICAgIGdldENoaWxkcmVuKCkgeyByZXR1cm4gW10gfSxcbiAgICBzZXRDaGlsZHJlbihzZWxmLCBjaGlsZHJlbikgeyBzZWxmLmxhYmVsID0gU3RyaW5nKGNoaWxkcmVuKSB9LFxufSlcblxuLy8gTGV2ZWxCYXJcbmV4cG9ydCB0eXBlIExldmVsQmFyUHJvcHMgPSBDb25zdHJ1Y3RQcm9wczxHdGsuTGV2ZWxCYXIsIEd0ay5MZXZlbEJhci5Db25zdHJ1Y3RvclByb3BzPlxuZXhwb3J0IGNvbnN0IExldmVsQmFyID0gYXN0YWxpZnk8R3RrLkxldmVsQmFyLCBHdGsuTGV2ZWxCYXIuQ29uc3RydWN0b3JQcm9wcz4oR3RrLkxldmVsQmFyLCB7XG4gICAgZ2V0Q2hpbGRyZW4oKSB7IHJldHVybiBbXSB9LFxufSlcblxuLy8gVE9ETzogTGlzdEJveFxuXG4vLyBPdmVybGF5XG5leHBvcnQgdHlwZSBPdmVybGF5UHJvcHMgPSBDb25zdHJ1Y3RQcm9wczxHdGsuT3ZlcmxheSwgR3RrLk92ZXJsYXkuQ29uc3RydWN0b3JQcm9wcz5cbmV4cG9ydCBjb25zdCBPdmVybGF5ID0gYXN0YWxpZnk8R3RrLk92ZXJsYXksIEd0ay5PdmVybGF5LkNvbnN0cnVjdG9yUHJvcHM+KEd0ay5PdmVybGF5LCB7XG4gICAgZ2V0Q2hpbGRyZW4oc2VsZikge1xuICAgICAgICBjb25zdCBjaGlsZHJlbjogQXJyYXk8R3RrLldpZGdldD4gPSBbXVxuICAgICAgICBsZXQgY2ggPSBzZWxmLmdldF9maXJzdF9jaGlsZCgpXG4gICAgICAgIHdoaWxlIChjaCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChjaClcbiAgICAgICAgICAgIGNoID0gY2guZ2V0X25leHRfc2libGluZygpXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2hpbGRyZW4uZmlsdGVyKGNoID0+IGNoICE9PSBzZWxmLmNoaWxkKVxuICAgIH0sXG4gICAgc2V0Q2hpbGRyZW4oc2VsZiwgY2hpbGRyZW4pIHtcbiAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBmaWx0ZXIoY2hpbGRyZW4pKSB7XG4gICAgICAgICAgICBjb25zdCB0eXBlcyA9IHR5cGUgaW4gY2hpbGRcbiAgICAgICAgICAgICAgICA/IChjaGlsZFt0eXBlXSBhcyBzdHJpbmcpLnNwbGl0KC9cXHMrLylcbiAgICAgICAgICAgICAgICA6IFtdXG5cbiAgICAgICAgICAgIGlmICh0eXBlcy5pbmNsdWRlcyhcIm92ZXJsYXlcIikpIHtcbiAgICAgICAgICAgICAgICBzZWxmLmFkZF9vdmVybGF5KGNoaWxkKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxmLnNldF9jaGlsZChjaGlsZClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2VsZi5zZXRfbWVhc3VyZV9vdmVybGF5KGNoaWxkLCB0eXBlcy5pbmNsdWRlcyhcIm1lYXN1cmVcIikpXG4gICAgICAgICAgICBzZWxmLnNldF9jbGlwX292ZXJsYXkoY2hpbGQsIHR5cGVzLmluY2x1ZGVzKFwiY2xpcFwiKSlcbiAgICAgICAgfVxuICAgIH0sXG59KVxuXG4vLyBSZXZlYWxlclxuZXhwb3J0IHR5cGUgUmV2ZWFsZXJQcm9wcyA9IENvbnN0cnVjdFByb3BzPEd0ay5SZXZlYWxlciwgR3RrLlJldmVhbGVyLkNvbnN0cnVjdG9yUHJvcHM+XG5leHBvcnQgY29uc3QgUmV2ZWFsZXIgPSBhc3RhbGlmeTxHdGsuUmV2ZWFsZXIsIEd0ay5SZXZlYWxlci5Db25zdHJ1Y3RvclByb3BzPihHdGsuUmV2ZWFsZXIpXG5cbi8vIFNsaWRlclxudHlwZSBTbGlkZXJTaWduYWxzID0ge1xuICAgIG9uQ2hhbmdlVmFsdWU6IFtdXG59XG5cbmV4cG9ydCB0eXBlIFNsaWRlclByb3BzID0gQ29uc3RydWN0UHJvcHM8QXN0YWwuU2xpZGVyLCBBc3RhbC5TbGlkZXIuQ29uc3RydWN0b3JQcm9wcywgU2xpZGVyU2lnbmFscz5cbmV4cG9ydCBjb25zdCBTbGlkZXIgPSBhc3RhbGlmeTxBc3RhbC5TbGlkZXIsIEFzdGFsLlNsaWRlci5Db25zdHJ1Y3RvclByb3BzLCBTbGlkZXJTaWduYWxzPihBc3RhbC5TbGlkZXIsIHtcbiAgICBnZXRDaGlsZHJlbigpIHsgcmV0dXJuIFtdIH0sXG59KVxuXG4vLyBTdGFja1xuZXhwb3J0IHR5cGUgU3RhY2tQcm9wcyA9IENvbnN0cnVjdFByb3BzPEd0ay5TdGFjaywgR3RrLlN0YWNrLkNvbnN0cnVjdG9yUHJvcHM+XG5leHBvcnQgY29uc3QgU3RhY2sgPSBhc3RhbGlmeTxHdGsuU3RhY2ssIEd0ay5TdGFjay5Db25zdHJ1Y3RvclByb3BzPihHdGsuU3RhY2ssIHtcbiAgICBzZXRDaGlsZHJlbihzZWxmLCBjaGlsZHJlbikge1xuICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGZpbHRlcihjaGlsZHJlbikpIHtcbiAgICAgICAgICAgIGlmIChjaGlsZC5uYW1lICE9IFwiXCIgJiYgY2hpbGQubmFtZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5hZGRfbmFtZWQoY2hpbGQsIGNoaWxkLm5hbWUpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbGYuYWRkX2NoaWxkKGNoaWxkKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbn0pXG5cbi8vIFN3aXRjaFxuZXhwb3J0IHR5cGUgU3dpdGNoUHJvcHMgPSBDb25zdHJ1Y3RQcm9wczxHdGsuU3dpdGNoLCBHdGsuU3dpdGNoLkNvbnN0cnVjdG9yUHJvcHM+XG5leHBvcnQgY29uc3QgU3dpdGNoID0gYXN0YWxpZnk8R3RrLlN3aXRjaCwgR3RrLlN3aXRjaC5Db25zdHJ1Y3RvclByb3BzPihHdGsuU3dpdGNoLCB7XG4gICAgZ2V0Q2hpbGRyZW4oKSB7IHJldHVybiBbXSB9LFxufSlcblxuLy8gV2luZG93XG5leHBvcnQgdHlwZSBXaW5kb3dQcm9wcyA9IENvbnN0cnVjdFByb3BzPEFzdGFsLldpbmRvdywgQXN0YWwuV2luZG93LkNvbnN0cnVjdG9yUHJvcHM+XG5leHBvcnQgY29uc3QgV2luZG93ID0gYXN0YWxpZnk8QXN0YWwuV2luZG93LCBBc3RhbC5XaW5kb3cuQ29uc3RydWN0b3JQcm9wcz4oQXN0YWwuV2luZG93KVxuXG4vLyBNZW51QnV0dG9uXG5leHBvcnQgdHlwZSBNZW51QnV0dG9uUHJvcHMgPSBDb25zdHJ1Y3RQcm9wczxHdGsuTWVudUJ1dHRvbiwgR3RrLk1lbnVCdXR0b24uQ29uc3RydWN0b3JQcm9wcz5cbmV4cG9ydCBjb25zdCBNZW51QnV0dG9uID0gYXN0YWxpZnk8R3RrLk1lbnVCdXR0b24sIEd0ay5NZW51QnV0dG9uLkNvbnN0cnVjdG9yUHJvcHM+KEd0ay5NZW51QnV0dG9uLCB7XG4gICAgZ2V0Q2hpbGRyZW4oc2VsZikgeyByZXR1cm4gW3NlbGYucG9wb3Zlciwgc2VsZi5jaGlsZF0gfSxcbiAgICBzZXRDaGlsZHJlbihzZWxmLCBjaGlsZHJlbikge1xuICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGZpbHRlcihjaGlsZHJlbikpIHtcbiAgICAgICAgICAgIGlmIChjaGlsZCBpbnN0YW5jZW9mIEd0ay5Qb3BvdmVyKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5zZXRfcG9wb3ZlcihjaGlsZClcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VsZi5zZXRfY2hpbGQoY2hpbGQpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxufSlcblxuLy8gUG9wb3BlclxuZXhwb3J0IHR5cGUgUG9wb3ZlclByb3BzID0gQ29uc3RydWN0UHJvcHM8R3RrLlBvcG92ZXIsIEd0ay5Qb3BvdmVyLkNvbnN0cnVjdG9yUHJvcHM+XG5leHBvcnQgY29uc3QgUG9wb3ZlciA9IGFzdGFsaWZ5PEd0ay5Qb3BvdmVyLCBHdGsuUG9wb3Zlci5Db25zdHJ1Y3RvclByb3BzPihHdGsuUG9wb3ZlcilcbiIsICJ3aW5kb3cuQmFyIHtcbiAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gIGNvbG9yOiAjZWNlZmY0O1xuICBmb250LWZhbWlseTogXCJKZXRCcmFpbnNNb25vIE5lcmQgRm9udCBNb25vXCI7XG4gIGZvbnQtd2VpZ2h0OiBub3JtYWw7XG4gIGZvbnQtc2l6ZTogMTRweDtcbn1cbndpbmRvdy5CYXIgPiBjZW50ZXJib3gge1xuICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcbiAgYm9yZGVyLXJhZGl1czogMDtcbiAgbWFyZ2luOiAwO1xuICBwYWRkaW5nOiA0cHggMTJweDtcbiAgYm9yZGVyOiBub25lO1xufVxud2luZG93LkJhciAubGVmdCB7XG4gIG1hcmdpbi1yaWdodDogMTJweDtcbn1cbndpbmRvdy5CYXIgLnJpZ2h0IHtcbiAgbWFyZ2luLWxlZnQ6IDEycHg7XG59XG53aW5kb3cuQmFyIC53b3Jrc3BhY2VzIHtcbiAgYmFja2dyb3VuZDogIzNiNDI1MjtcbiAgYm9yZGVyLXJhZGl1czogNnB4O1xuICBwYWRkaW5nOiAxcHg7XG4gIGJvcmRlcjogbm9uZTtcbn1cbndpbmRvdy5CYXIgLndvcmtzcGFjZXMgLndvcmtzcGFjZSB7XG4gIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xuICBib3JkZXI6IG5vbmU7XG4gIGJvcmRlci1yYWRpdXM6IDA7XG4gIHBhZGRpbmc6IDRweCA4cHg7XG4gIG1hcmdpbjogMDtcbiAgbWluLXdpZHRoOiAyNHB4O1xuICBjb2xvcjogI2Q4ZGVlOTtcbiAgdHJhbnNpdGlvbjogYWxsIDIwMG1zIGVhc2U7XG4gIGZvbnQtd2VpZ2h0OiBub3JtYWw7XG4gIGZvbnQtc2l6ZTogMTRweDtcbn1cbndpbmRvdy5CYXIgLndvcmtzcGFjZXMgLndvcmtzcGFjZTpvbmx5LWNoaWxkIHtcbiAgYm9yZGVyLXJhZGl1czogNXB4O1xufVxud2luZG93LkJhciAud29ya3NwYWNlcyAud29ya3NwYWNlOmhvdmVyIHtcbiAgYmFja2dyb3VuZDogcmdiYSgyMTYsIDIyMiwgMjMzLCAwLjE1KTtcbiAgY29sb3I6ICNlY2VmZjQ7XG59XG53aW5kb3cuQmFyIC53b3Jrc3BhY2VzIC53b3Jrc3BhY2UuYWN0aXZlIHtcbiAgYmFja2dyb3VuZDogIzVlODFhYztcbiAgY29sb3I6ICNlY2VmZjQ7XG59XG53aW5kb3cuQmFyIC5hY3RpdmUtd2luZG93IHtcbiAgcGFkZGluZzogNHB4IDhweDtcbiAgYm9yZGVyLXJhZGl1czogNnB4O1xuICBiYWNrZ3JvdW5kOiAjNDM0YzVlO1xuICBib3JkZXI6IG5vbmU7XG4gIG1pbi13aWR0aDogMTIwcHg7XG59XG53aW5kb3cuQmFyIC5hY3RpdmUtd2luZG93IGxhYmVsIHtcbiAgY29sb3I6ICNlNWU5ZjA7XG4gIGZvbnQtc3R5bGU6IGl0YWxpYztcbn1cbndpbmRvdy5CYXIgLmNsb2NrIHtcbiAgY29sb3I6ICNlY2VmZjQ7XG4gIHBhZGRpbmc6IDRweCA4cHg7XG4gIGJvcmRlci1yYWRpdXM6IDZweDtcbiAgYmFja2dyb3VuZDogIzQzNGM1ZTtcbiAgYm9yZGVyOiBub25lO1xufVxud2luZG93LkJhciAuc3lzdGVtLWluZm8gLmNwdSwgd2luZG93LkJhciAuc3lzdGVtLWluZm8gLm1lbW9yeSB7XG4gIHBhZGRpbmc6IDRweCA2cHg7XG4gIGJvcmRlci1yYWRpdXM6IDRweDtcbiAgYmFja2dyb3VuZDogIzQzNGM1ZTtcbn1cbndpbmRvdy5CYXIgLnN5c3RlbS1pbmZvIC5jcHUgbGFiZWw6Zmlyc3QtY2hpbGQsIHdpbmRvdy5CYXIgLnN5c3RlbS1pbmZvIC5tZW1vcnkgbGFiZWw6Zmlyc3QtY2hpbGQge1xuICBjb2xvcjogI2Q4ZGVlOTtcbn1cbndpbmRvdy5CYXIgLnN5c3RlbS1pbmZvIC5jcHUgbGFiZWw6bGFzdC1jaGlsZCwgd2luZG93LkJhciAuc3lzdGVtLWluZm8gLm1lbW9yeSBsYWJlbDpsYXN0LWNoaWxkIHtcbiAgY29sb3I6ICNlY2VmZjQ7XG59XG53aW5kb3cuQmFyIC5zeXN0ZW0taW5mbyAuY3B1IHtcbiAgYmFja2dyb3VuZDogIzQzNGM1ZTtcbiAgYm9yZGVyOiBub25lO1xufVxud2luZG93LkJhciAuc3lzdGVtLWluZm8gLmNwdSBsYWJlbDpsYXN0LWNoaWxkIHtcbiAgY29sb3I6ICNhM2JlOGM7XG59XG53aW5kb3cuQmFyIC5zeXN0ZW0taW5mbyAubWVtb3J5IHtcbiAgYmFja2dyb3VuZDogIzQzNGM1ZTtcbiAgYm9yZGVyOiBub25lO1xufVxud2luZG93LkJhciAuc3lzdGVtLWluZm8gLm1lbW9yeSBsYWJlbDpsYXN0LWNoaWxkIHtcbiAgY29sb3I6ICNlYmNiOGI7XG59XG53aW5kb3cuQmFyIC5zeXN0ZW0taW5mbyAuYXVkaW8ge1xuICBwYWRkaW5nOiA0cHggOHB4O1xuICBib3JkZXItcmFkaXVzOiA2cHg7XG4gIGJhY2tncm91bmQ6ICM0MzRjNWU7XG4gIGJvcmRlcjogbm9uZTtcbiAgdHJhbnNpdGlvbjogYWxsIDIwMG1zIGVhc2U7XG59XG53aW5kb3cuQmFyIC5zeXN0ZW0taW5mbyAuYXVkaW86aG92ZXIge1xuICBiYWNrZ3JvdW5kOiAjNGM1NjZhO1xuICBib3JkZXItY29sb3I6ICM4OGMwZDA7XG59XG53aW5kb3cuQmFyIC5zeXN0ZW0taW5mbyAuYXVkaW8gYm94IGxhYmVsOmZpcnN0LWNoaWxkIHtcbiAgY29sb3I6ICNkOGRlZTk7XG59XG53aW5kb3cuQmFyIC5zeXN0ZW0taW5mbyAuYXVkaW8gYm94IGxhYmVsOmxhc3QtY2hpbGQge1xuICBjb2xvcjogI2I0OGVhZDtcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XG59XG53aW5kb3cuQmFyIGJ1dHRvbiB7XG4gIGJvcmRlci1yYWRpdXM6IDJweDtcbiAgbWFyZ2luOiAwO1xuICBib3JkZXI6IG5vbmU7XG4gIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xuICB0cmFuc2l0aW9uOiBhbGwgMjAwbXMgZWFzZTtcbiAgb3V0bGluZTogbm9uZTtcbiAgYm94LXNoYWRvdzogbm9uZTtcbn1cbndpbmRvdy5CYXIgYnV0dG9uOm5vdCg6Zm9jdXMpIHtcbiAgY29sb3I6ICM0YzU2NmE7XG59XG53aW5kb3cuQmFyIGJ1dHRvbjpmb2N1cyB7XG4gIG91dGxpbmU6IG5vbmU7XG4gIGJveC1zaGFkb3c6IG5vbmU7XG59XG53aW5kb3cuQmFyIGJ1dHRvbjpob3ZlciB7XG4gIG91dGxpbmU6IG5vbmU7XG59XG53aW5kb3cuQmFyIGJ1dHRvbjphY3RpdmUge1xuICBvdXRsaW5lOiBub25lO1xuICBib3gtc2hhZG93OiBub25lO1xufVxuXG53aW5kb3cuV2FsbHBhcGVyIHtcbiAgYmFja2dyb3VuZDogIzJlMzQ0MDtcbn0iLCAiaW1wb3J0IFwiLi9vdmVycmlkZXMuanNcIlxuZXhwb3J0IHsgZGVmYXVsdCBhcyBBc3RhbElPIH0gZnJvbSBcImdpOi8vQXN0YWxJTz92ZXJzaW9uPTAuMVwiXG5leHBvcnQgKiBmcm9tIFwiLi9wcm9jZXNzLmpzXCJcbmV4cG9ydCAqIGZyb20gXCIuL3RpbWUuanNcIlxuZXhwb3J0ICogZnJvbSBcIi4vZmlsZS5qc1wiXG5leHBvcnQgKiBmcm9tIFwiLi9nb2JqZWN0LmpzXCJcbmV4cG9ydCB7IEJpbmRpbmcsIGJpbmQgfSBmcm9tIFwiLi9iaW5kaW5nLmpzXCJcbmV4cG9ydCB7IFZhcmlhYmxlLCBkZXJpdmUgfSBmcm9tIFwiLi92YXJpYWJsZS5qc1wiXG4iLCAiaW1wb3J0IEFzdGFsIGZyb20gXCJnaTovL0FzdGFsSU9cIlxuaW1wb3J0IEdpbyBmcm9tIFwiZ2k6Ly9HaW8/dmVyc2lvbj0yLjBcIlxuXG5leHBvcnQgeyBHaW8gfVxuXG5leHBvcnQgZnVuY3Rpb24gcmVhZEZpbGUocGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gQXN0YWwucmVhZF9maWxlKHBhdGgpIHx8IFwiXCJcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRGaWxlQXN5bmMocGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBBc3RhbC5yZWFkX2ZpbGVfYXN5bmMocGF0aCwgKF8sIHJlcykgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKEFzdGFsLnJlYWRfZmlsZV9maW5pc2gocmVzKSB8fCBcIlwiKVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlRmlsZShwYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZyk6IHZvaWQge1xuICAgIEFzdGFsLndyaXRlX2ZpbGUocGF0aCwgY29udGVudClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlRmlsZUFzeW5jKHBhdGg6IHN0cmluZywgY29udGVudDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgQXN0YWwud3JpdGVfZmlsZV9hc3luYyhwYXRoLCBjb250ZW50LCAoXywgcmVzKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoQXN0YWwud3JpdGVfZmlsZV9maW5pc2gocmVzKSlcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtb25pdG9yRmlsZShcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgY2FsbGJhY2s6IChmaWxlOiBzdHJpbmcsIGV2ZW50OiBHaW8uRmlsZU1vbml0b3JFdmVudCkgPT4gdm9pZCxcbik6IEdpby5GaWxlTW9uaXRvciB7XG4gICAgcmV0dXJuIEFzdGFsLm1vbml0b3JfZmlsZShwYXRoLCAoZmlsZTogc3RyaW5nLCBldmVudDogR2lvLkZpbGVNb25pdG9yRXZlbnQpID0+IHtcbiAgICAgICAgY2FsbGJhY2soZmlsZSwgZXZlbnQpXG4gICAgfSkhXG59XG4iLCAiaW1wb3J0IEdPYmplY3QgZnJvbSBcImdpOi8vR09iamVjdFwiXG5cbmV4cG9ydCB7IGRlZmF1bHQgYXMgR0xpYiB9IGZyb20gXCJnaTovL0dMaWI/dmVyc2lvbj0yLjBcIlxuZXhwb3J0IHsgR09iamVjdCwgR09iamVjdCBhcyBkZWZhdWx0IH1cblxuY29uc3QgbWV0YSA9IFN5bWJvbChcIm1ldGFcIilcbmNvbnN0IHByaXYgPSBTeW1ib2woXCJwcml2XCIpXG5cbmNvbnN0IHsgUGFyYW1TcGVjLCBQYXJhbUZsYWdzIH0gPSBHT2JqZWN0XG5cbmNvbnN0IGtlYmFiaWZ5ID0gKHN0cjogc3RyaW5nKSA9PiBzdHJcbiAgICAucmVwbGFjZSgvKFthLXpdKShbQS1aXSkvZywgXCIkMS0kMlwiKVxuICAgIC5yZXBsYWNlQWxsKFwiX1wiLCBcIi1cIilcbiAgICAudG9Mb3dlckNhc2UoKVxuXG50eXBlIFNpZ25hbERlY2xhcmF0aW9uID0ge1xuICAgIGZsYWdzPzogR09iamVjdC5TaWduYWxGbGFnc1xuICAgIGFjY3VtdWxhdG9yPzogR09iamVjdC5BY2N1bXVsYXRvclR5cGVcbiAgICByZXR1cm5fdHlwZT86IEdPYmplY3QuR1R5cGVcbiAgICBwYXJhbV90eXBlcz86IEFycmF5PEdPYmplY3QuR1R5cGU+XG59XG5cbnR5cGUgUHJvcGVydHlEZWNsYXJhdGlvbiA9XG4gICAgfCBJbnN0YW5jZVR5cGU8dHlwZW9mIEdPYmplY3QuUGFyYW1TcGVjPlxuICAgIHwgeyAkZ3R5cGU6IEdPYmplY3QuR1R5cGUgfVxuICAgIHwgdHlwZW9mIFN0cmluZ1xuICAgIHwgdHlwZW9mIE51bWJlclxuICAgIHwgdHlwZW9mIEJvb2xlYW5cbiAgICB8IHR5cGVvZiBPYmplY3RcblxudHlwZSBHT2JqZWN0Q29uc3RydWN0b3IgPSB7XG4gICAgW21ldGFdPzoge1xuICAgICAgICBQcm9wZXJ0aWVzPzogeyBba2V5OiBzdHJpbmddOiBHT2JqZWN0LlBhcmFtU3BlYyB9XG4gICAgICAgIFNpZ25hbHM/OiB7IFtrZXk6IHN0cmluZ106IEdPYmplY3QuU2lnbmFsRGVmaW5pdGlvbiB9XG4gICAgfVxuICAgIG5ldyguLi5hcmdzOiBhbnlbXSk6IGFueVxufVxuXG50eXBlIE1ldGFJbmZvID0gR09iamVjdC5NZXRhSW5mbzxuZXZlciwgQXJyYXk8eyAkZ3R5cGU6IEdPYmplY3QuR1R5cGUgfT4sIG5ldmVyPlxuXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXIob3B0aW9uczogTWV0YUluZm8gPSB7fSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoY2xzOiBHT2JqZWN0Q29uc3RydWN0b3IpIHtcbiAgICAgICAgY29uc3QgdCA9IG9wdGlvbnMuVGVtcGxhdGVcbiAgICAgICAgaWYgKHR5cGVvZiB0ID09PSBcInN0cmluZ1wiICYmICF0LnN0YXJ0c1dpdGgoXCJyZXNvdXJjZTovL1wiKSAmJiAhdC5zdGFydHNXaXRoKFwiZmlsZTovL1wiKSkge1xuICAgICAgICAgICAgLy8gYXNzdW1lIHhtbCB0ZW1wbGF0ZVxuICAgICAgICAgICAgb3B0aW9ucy5UZW1wbGF0ZSA9IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZSh0KVxuICAgICAgICB9XG5cbiAgICAgICAgR09iamVjdC5yZWdpc3RlckNsYXNzKHtcbiAgICAgICAgICAgIFNpZ25hbHM6IHsgLi4uY2xzW21ldGFdPy5TaWduYWxzIH0sXG4gICAgICAgICAgICBQcm9wZXJ0aWVzOiB7IC4uLmNsc1ttZXRhXT8uUHJvcGVydGllcyB9LFxuICAgICAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgfSwgY2xzKVxuXG4gICAgICAgIGRlbGV0ZSBjbHNbbWV0YV1cbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwcm9wZXJ0eShkZWNsYXJhdGlvbjogUHJvcGVydHlEZWNsYXJhdGlvbiA9IE9iamVjdCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0OiBhbnksIHByb3A6IGFueSwgZGVzYz86IFByb3BlcnR5RGVzY3JpcHRvcikge1xuICAgICAgICB0YXJnZXQuY29uc3RydWN0b3JbbWV0YV0gPz89IHt9XG4gICAgICAgIHRhcmdldC5jb25zdHJ1Y3RvclttZXRhXS5Qcm9wZXJ0aWVzID8/PSB7fVxuXG4gICAgICAgIGNvbnN0IG5hbWUgPSBrZWJhYmlmeShwcm9wKVxuXG4gICAgICAgIGlmICghZGVzYykge1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgcHJvcCwge1xuICAgICAgICAgICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbcHJpdl0/Lltwcm9wXSA/PyBkZWZhdWx0VmFsdWUoZGVjbGFyYXRpb24pXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzZXQodjogYW55KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2ICE9PSB0aGlzW3Byb3BdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzW3ByaXZdID8/PSB7fVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1twcml2XVtwcm9wXSA9IHZcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubm90aWZ5KG5hbWUpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgYHNldF8ke25hbWUucmVwbGFjZShcIi1cIiwgXCJfXCIpfWAsIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSh2OiBhbnkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpc1twcm9wXSA9IHZcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgYGdldF8ke25hbWUucmVwbGFjZShcIi1cIiwgXCJfXCIpfWAsIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbcHJvcF1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgdGFyZ2V0LmNvbnN0cnVjdG9yW21ldGFdLlByb3BlcnRpZXNba2ViYWJpZnkocHJvcCldID0gcHNwZWMobmFtZSwgUGFyYW1GbGFncy5SRUFEV1JJVEUsIGRlY2xhcmF0aW9uKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGV0IGZsYWdzID0gMFxuICAgICAgICAgICAgaWYgKGRlc2MuZ2V0KSBmbGFncyB8PSBQYXJhbUZsYWdzLlJFQURBQkxFXG4gICAgICAgICAgICBpZiAoZGVzYy5zZXQpIGZsYWdzIHw9IFBhcmFtRmxhZ3MuV1JJVEFCTEVcblxuICAgICAgICAgICAgdGFyZ2V0LmNvbnN0cnVjdG9yW21ldGFdLlByb3BlcnRpZXNba2ViYWJpZnkocHJvcCldID0gcHNwZWMobmFtZSwgZmxhZ3MsIGRlY2xhcmF0aW9uKVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2lnbmFsKC4uLnBhcmFtczogQXJyYXk8eyAkZ3R5cGU6IEdPYmplY3QuR1R5cGUgfSB8IHR5cGVvZiBPYmplY3Q+KTpcbih0YXJnZXQ6IGFueSwgc2lnbmFsOiBhbnksIGRlc2M/OiBQcm9wZXJ0eURlc2NyaXB0b3IpID0+IHZvaWRcblxuZXhwb3J0IGZ1bmN0aW9uIHNpZ25hbChkZWNsYXJhdGlvbj86IFNpZ25hbERlY2xhcmF0aW9uKTpcbih0YXJnZXQ6IGFueSwgc2lnbmFsOiBhbnksIGRlc2M/OiBQcm9wZXJ0eURlc2NyaXB0b3IpID0+IHZvaWRcblxuZXhwb3J0IGZ1bmN0aW9uIHNpZ25hbChcbiAgICBkZWNsYXJhdGlvbj86IFNpZ25hbERlY2xhcmF0aW9uIHwgeyAkZ3R5cGU6IEdPYmplY3QuR1R5cGUgfSB8IHR5cGVvZiBPYmplY3QsXG4gICAgLi4ucGFyYW1zOiBBcnJheTx7ICRndHlwZTogR09iamVjdC5HVHlwZSB9IHwgdHlwZW9mIE9iamVjdD5cbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0OiBhbnksIHNpZ25hbDogYW55LCBkZXNjPzogUHJvcGVydHlEZXNjcmlwdG9yKSB7XG4gICAgICAgIHRhcmdldC5jb25zdHJ1Y3RvclttZXRhXSA/Pz0ge31cbiAgICAgICAgdGFyZ2V0LmNvbnN0cnVjdG9yW21ldGFdLlNpZ25hbHMgPz89IHt9XG5cbiAgICAgICAgY29uc3QgbmFtZSA9IGtlYmFiaWZ5KHNpZ25hbClcblxuICAgICAgICBpZiAoZGVjbGFyYXRpb24gfHwgcGFyYW1zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgVE9ETzogdHlwZSBhc3NlcnRcbiAgICAgICAgICAgIGNvbnN0IGFyciA9IFtkZWNsYXJhdGlvbiwgLi4ucGFyYW1zXS5tYXAodiA9PiB2LiRndHlwZSlcbiAgICAgICAgICAgIHRhcmdldC5jb25zdHJ1Y3RvclttZXRhXS5TaWduYWxzW25hbWVdID0ge1xuICAgICAgICAgICAgICAgIHBhcmFtX3R5cGVzOiBhcnIsXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0YXJnZXQuY29uc3RydWN0b3JbbWV0YV0uU2lnbmFsc1tuYW1lXSA9IGRlY2xhcmF0aW9uIHx8IHtcbiAgICAgICAgICAgICAgICBwYXJhbV90eXBlczogW10sXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWRlc2MpIHtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIHNpZ25hbCwge1xuICAgICAgICAgICAgICAgIHZhbHVlOiBmdW5jdGlvbiAoLi4uYXJnczogYW55W10pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KG5hbWUsIC4uLmFyZ3MpXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBvZzogKCguLi5hcmdzOiBhbnlbXSkgPT4gdm9pZCkgPSBkZXNjLnZhbHVlXG4gICAgICAgICAgICBkZXNjLnZhbHVlID0gZnVuY3Rpb24gKC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciBub3QgdHlwZWRcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQobmFtZSwgLi4uYXJncylcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGBvbl8ke25hbWUucmVwbGFjZShcIi1cIiwgXCJfXCIpfWAsIHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogZnVuY3Rpb24gKC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvZy5hcHBseSh0aGlzLCBhcmdzKVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwc3BlYyhuYW1lOiBzdHJpbmcsIGZsYWdzOiBudW1iZXIsIGRlY2xhcmF0aW9uOiBQcm9wZXJ0eURlY2xhcmF0aW9uKSB7XG4gICAgaWYgKGRlY2xhcmF0aW9uIGluc3RhbmNlb2YgUGFyYW1TcGVjKVxuICAgICAgICByZXR1cm4gZGVjbGFyYXRpb25cblxuICAgIHN3aXRjaCAoZGVjbGFyYXRpb24pIHtcbiAgICAgICAgY2FzZSBTdHJpbmc6XG4gICAgICAgICAgICByZXR1cm4gUGFyYW1TcGVjLnN0cmluZyhuYW1lLCBcIlwiLCBcIlwiLCBmbGFncywgXCJcIilcbiAgICAgICAgY2FzZSBOdW1iZXI6XG4gICAgICAgICAgICByZXR1cm4gUGFyYW1TcGVjLmRvdWJsZShuYW1lLCBcIlwiLCBcIlwiLCBmbGFncywgLU51bWJlci5NQVhfVkFMVUUsIE51bWJlci5NQVhfVkFMVUUsIDApXG4gICAgICAgIGNhc2UgQm9vbGVhbjpcbiAgICAgICAgICAgIHJldHVybiBQYXJhbVNwZWMuYm9vbGVhbihuYW1lLCBcIlwiLCBcIlwiLCBmbGFncywgZmFsc2UpXG4gICAgICAgIGNhc2UgT2JqZWN0OlxuICAgICAgICAgICAgcmV0dXJuIFBhcmFtU3BlYy5qc29iamVjdChuYW1lLCBcIlwiLCBcIlwiLCBmbGFncylcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgbWlzc3R5cGVkXG4gICAgICAgICAgICByZXR1cm4gUGFyYW1TcGVjLm9iamVjdChuYW1lLCBcIlwiLCBcIlwiLCBmbGFncywgZGVjbGFyYXRpb24uJGd0eXBlKVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZGVmYXVsdFZhbHVlKGRlY2xhcmF0aW9uOiBQcm9wZXJ0eURlY2xhcmF0aW9uKSB7XG4gICAgaWYgKGRlY2xhcmF0aW9uIGluc3RhbmNlb2YgUGFyYW1TcGVjKVxuICAgICAgICByZXR1cm4gZGVjbGFyYXRpb24uZ2V0X2RlZmF1bHRfdmFsdWUoKVxuXG4gICAgc3dpdGNoIChkZWNsYXJhdGlvbikge1xuICAgICAgICBjYXNlIFN0cmluZzpcbiAgICAgICAgICAgIHJldHVybiBcIlwiXG4gICAgICAgIGNhc2UgTnVtYmVyOlxuICAgICAgICAgICAgcmV0dXJuIDBcbiAgICAgICAgY2FzZSBCb29sZWFuOlxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIGNhc2UgT2JqZWN0OlxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBBc3RhbCwgR3RrLCBHZGsgfSBmcm9tIFwiYXN0YWwvZ3RrNFwiXG5pbXBvcnQgeyBWYXJpYWJsZSwgZXhlYywgZXhlY0FzeW5jLCBiaW5kIH0gZnJvbSBcImFzdGFsXCJcbmltcG9ydCBIeXBybGFuZCBmcm9tIFwiZ2k6Ly9Bc3RhbEh5cHJsYW5kXCJcbmltcG9ydCBXcCBmcm9tIFwiZ2k6Ly9Bc3RhbFdwXCJcblxuY29uc3QgaHlwcmxhbmQgPSBIeXBybGFuZC5nZXRfZGVmYXVsdCgpXG5jb25zdCBhdWRpbyA9IFdwLmdldF9kZWZhdWx0KClcblxuLy8gVGltZSB3aXRoIG1pY3Jvc2Vjb25kIHByZWNpc2lvbiAgXG5jb25zdCB0aW1lID0gVmFyaWFibGUoXCJcIikucG9sbCg2MCAqIDEwMDAsICgpID0+IHtcbiAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpXG4gICAgY29uc3QgZGF5cyA9IFsnU3VuJywgJ01vbicsICdUdWUnLCAnV2VkJywgJ1RodScsICdGcmknLCAnU2F0J11cbiAgICBjb25zdCBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJywgJ09jdCcsICdOb3YnLCAnRGVjJ11cbiAgICBcbiAgICBjb25zdCBkYXkgPSBkYXlzW25vdy5nZXREYXkoKV1cbiAgICBjb25zdCBtb250aCA9IG1vbnRoc1tub3cuZ2V0TW9udGgoKV1cbiAgICBjb25zdCBkYXRlID0gbm93LmdldERhdGUoKVxuICAgIGNvbnN0IGhvdXJzID0gbm93LmdldEhvdXJzKCkudG9TdHJpbmcoKS5wYWRTdGFydCgyLCAnMCcpXG4gICAgY29uc3QgbWludXRlcyA9IG5vdy5nZXRNaW51dGVzKCkudG9TdHJpbmcoKS5wYWRTdGFydCgyLCAnMCcpXG5cbiAgICByZXR1cm4gYCR7ZGF5fSAke21vbnRofSAke2RhdGV9ICR7aG91cnN9OiR7bWludXRlc31gXG59KVxuXG4vLyBBY3RpdmUgd29ya3NwYWNlIHVzaW5nIEh5cHJsYW5kIEFQSVxuY29uc3QgYWN0aXZlV29ya3NwYWNlID0gVmFyaWFibGUoaHlwcmxhbmQuZ2V0X2ZvY3VzZWRfd29ya3NwYWNlKCk/LmdldF9pZCgpIHx8IDEpXG5cbi8vIFVwZGF0ZSBhY3RpdmUgd29ya3NwYWNlIHdoZW4gaXQgY2hhbmdlc1xuZnVuY3Rpb24gdXBkYXRlQWN0aXZlV29ya3NwYWNlKCkge1xuICAgIGNvbnN0IHdvcmtzcGFjZSA9IGh5cHJsYW5kLmdldF9mb2N1c2VkX3dvcmtzcGFjZSgpXG4gICAgaWYgKHdvcmtzcGFjZSkge1xuICAgICAgICBhY3RpdmVXb3Jrc3BhY2Uuc2V0KHdvcmtzcGFjZS5nZXRfaWQoKSlcbiAgICB9XG59XG5cbi8vIFdvcmtzcGFjZXMgd2l0aCB3aW5kb3dzIHVzaW5nIEh5cHJsYW5kIEFQSVxuY29uc3Qgd29ya3NwYWNlc1dpdGhXaW5kb3dzID0gVmFyaWFibGU8bnVtYmVyW10+KFtdKVxuXG5mdW5jdGlvbiB1cGRhdGVXb3Jrc3BhY2VzKCkge1xuICAgIGNvbnN0IHdvcmtzcGFjZXMgPSBoeXBybGFuZC5nZXRfd29ya3NwYWNlcygpXG4gICAgY29uc3QgYWN0aXZlV3MgPSBoeXBybGFuZC5nZXRfZm9jdXNlZF93b3Jrc3BhY2UoKT8uZ2V0X2lkKCkgfHwgMVxuICAgIFxuICAgIC8vIEdldCB3b3Jrc3BhY2VzIHRoYXQgaGF2ZSB3aW5kb3dzXG4gICAgY29uc3Qgd29ya3NwYWNlc1dpdGhXaW5zID0gd29ya3NwYWNlc1xuICAgICAgICAuZmlsdGVyKCh3czogYW55KSA9PiB3cy5nZXRfY2xpZW50cygpLmxlbmd0aCA+IDApXG4gICAgICAgIC5tYXAoKHdzOiBhbnkpID0+IHdzLmdldF9pZCgpKVxuICAgIFxuICAgIC8vIEFsd2F5cyBpbmNsdWRlIHRoZSBhY3RpdmUgd29ya3NwYWNlIGV2ZW4gaWYgaXQgaGFzIG5vIHdpbmRvd3NcbiAgICBjb25zdCBhbGxXb3Jrc3BhY2VzID0gWy4uLm5ldyBTZXQoWy4uLndvcmtzcGFjZXNXaXRoV2lucywgYWN0aXZlV3NdKV1cbiAgICBcbiAgICB3b3Jrc3BhY2VzV2l0aFdpbmRvd3Muc2V0KGFsbFdvcmtzcGFjZXMuc29ydCgoYTogbnVtYmVyLCBiOiBudW1iZXIpID0+IGEgLSBiKSlcbn1cblxuLy8gQWN0aXZlIHdpbmRvdyB1c2luZyBIeXBybGFuZCBBUElcbmNvbnN0IGFjdGl2ZVdpbmRvdyA9IFZhcmlhYmxlKFwiXCIpXG5cbmZ1bmN0aW9uIHVwZGF0ZUFjdGl2ZVdpbmRvdygpIHtcbiAgICBjb25zdCBjbGllbnQgPSBoeXBybGFuZC5nZXRfZm9jdXNlZF9jbGllbnQoKVxuICAgIGlmIChjbGllbnQgJiYgY2xpZW50LmdldF90aXRsZSgpKSB7XG4gICAgICAgIGFjdGl2ZVdpbmRvdy5zZXQoY2xpZW50LmdldF90aXRsZSgpKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHdvcmtzcGFjZSA9IGh5cHJsYW5kLmdldF9mb2N1c2VkX3dvcmtzcGFjZSgpXG4gICAgICAgIGFjdGl2ZVdpbmRvdy5zZXQoYFdvcmtzcGFjZSAke3dvcmtzcGFjZT8uZ2V0X2lkKCkgfHwgMX1gKVxuICAgIH1cbn1cbi8vIGluaXRpYWwgdXBkYXRlIFxudXBkYXRlQWN0aXZlV29ya3NwYWNlKClcbnVwZGF0ZUFjdGl2ZVdpbmRvdygpXG51cGRhdGVXb3Jrc3BhY2VzKClcblxuLy8gTGlzdGVuIGZvciBhbGwgcmVsZXZhbnQgZXZlbnRzXG5oeXBybGFuZC5jb25uZWN0KFwiZXZlbnRcIiwgKF86IGFueSwgZXZlbnQ6IHN0cmluZywgZGF0YTogc3RyaW5nKSA9PiB7XG4gICAgaWYgKGV2ZW50ID09PSBcIndvcmtzcGFjZVwiKSB7XG4gICAgICAgIC8vIFBhcnNlIHdvcmtzcGFjZSBJRCBmcm9tIGV2ZW50IGRhdGEgKGZvcm1hdDogXCJ3b3Jrc3BhY2U+PklEXCIpXG4gICAgICAgIGNvbnN0IHdvcmtzcGFjZUlkID0gcGFyc2VJbnQoZGF0YSlcbiAgICAgICAgaWYgKCFpc05hTih3b3Jrc3BhY2VJZCkpIHtcbiAgICAgICAgICAgIGFjdGl2ZVdvcmtzcGFjZS5zZXQod29ya3NwYWNlSWQpXG4gICAgICAgIH1cbiAgICAgICAgLy8gVXBkYXRlIHdvcmtzcGFjZXMgYW5kIHdpbmRvdyBpbmZvIHdpdGggcmV0cnkgbG9naWNcbiAgICAgICAgcmV0cnlVcGRhdGUoKCkgPT4ge1xuICAgICAgICAgICAgdXBkYXRlV29ya3NwYWNlcygpXG4gICAgICAgICAgICB1cGRhdGVBY3RpdmVXaW5kb3coKVxuICAgICAgICB9KVxuICAgIH0gZWxzZSBpZiAoZXZlbnQgPT09IFwiZm9jdXNlZG1vblwiIHx8IGV2ZW50ID09PSBcImFjdGl2ZXdpbmRvd1wiKSB7XG4gICAgICAgIC8vIEZvciB0aGVzZSBldmVudHMsIHdlIG5lZWQgdG8gcXVlcnkgY3VycmVudCBzdGF0ZSB3aXRoIHJldHJ5XG4gICAgICAgIHJldHJ5VXBkYXRlKCgpID0+IHtcbiAgICAgICAgICAgIHVwZGF0ZUFjdGl2ZVdvcmtzcGFjZSgpXG4gICAgICAgICAgICB1cGRhdGVBY3RpdmVXaW5kb3coKVxuICAgICAgICAgICAgdXBkYXRlV29ya3NwYWNlcygpXG4gICAgICAgIH0pXG4gICAgfVxufSlcblxuLy8gUm9idXN0IHJldHJ5IGZ1bmN0aW9uIHdpdGggZXhwb25lbnRpYWwgYmFja29mZlxuZnVuY3Rpb24gcmV0cnlVcGRhdGUodXBkYXRlRm46ICgpID0+IHZvaWQsIG1heFJldHJpZXM6IG51bWJlciA9IDMsIGRlbGF5OiBudW1iZXIgPSA1KSB7XG4gICAgbGV0IHJldHJpZXMgPSAwXG4gICAgXG4gICAgZnVuY3Rpb24gYXR0ZW1wdCgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHByZXZBY3RpdmVXcyA9IGFjdGl2ZVdvcmtzcGFjZS5nZXQoKVxuICAgICAgICAgICAgdXBkYXRlRm4oKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBJZiB3b3Jrc3BhY2UgZGlkbid0IGNoYW5nZSB3aGVuIHdlIGV4cGVjdGVkIGl0IHRvLCByZXRyeVxuICAgICAgICAgICAgaWYgKHJldHJpZXMgPCBtYXhSZXRyaWVzKSB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld0FjdGl2ZVdzID0gYWN0aXZlV29ya3NwYWNlLmdldCgpXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcmV2QWN0aXZlV3MgPT09IG5ld0FjdGl2ZVdzICYmIHJldHJpZXMgPCBtYXhSZXRyaWVzIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0cmllcysrXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGF0dGVtcHQsIGRlbGF5ICogTWF0aC5wb3coMiwgcmV0cmllcykpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LCBkZWxheSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGlmIChyZXRyaWVzIDwgbWF4UmV0cmllcykge1xuICAgICAgICAgICAgICAgIHJldHJpZXMrK1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoYXR0ZW1wdCwgZGVsYXkgKiBNYXRoLnBvdygyLCByZXRyaWVzKSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBhdHRlbXB0KClcbn1cblxuLy8gU3lzdGVtIGluZm9cbmNvbnN0IGNwdVVzYWdlID0gVmFyaWFibGUoXCIwJVwiKS5wb2xsKDEwMDAsICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCBvdXRwdXQgPSBleGVjKFwidG9wIC1ibjEgfCBncmVwICdDcHUocyknIHwgYXdrICd7cHJpbnQgJDJ9JyB8IGN1dCAtZCclJyAtZjFcIilcbiAgICAgICAgcmV0dXJuIGAke01hdGgucm91bmQocGFyc2VGbG9hdChvdXRwdXQpKX0lYFxuICAgIH0gY2F0Y2gge1xuICAgICAgICByZXR1cm4gXCJFUlIlXCJcbiAgICB9XG59KVxuXG5jb25zdCBtZW1vcnlVc2FnZSA9IFZhcmlhYmxlKFwiMCVcIikucG9sbCgxMDAwLCAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3Qgb3V0cHV0ID0gZXhlYyhcImZyZWUgfCBncmVwIE1lbSB8IGF3ayAne3ByaW50ZiBcXFwiJS4xZlxcXCIsICQzLyQyICogMTAwLjB9J1wiKVxuICAgICAgICByZXR1cm4gYCR7b3V0cHV0fSVgXG4gICAgfSBjYXRjaCB7XG4gICAgICAgIHJldHVybiBcIkVSUiVcIlxuICAgIH1cbn0pXG5cbmNvbnN0IGF1ZGlvVm9sdW1lID0gVmFyaWFibGUoe2ljb246IFwiXCIsIHZvbHVtZTogXCIwJVwifSkucG9sbCgxMDAsICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgICBsZXQgb3V0cHV0ID0gcGFyc2VGbG9hdChhdWRpby5kZWZhdWx0X3NwZWFrZXIudm9sdW1lKTtcbiAgICAgICAgb3V0cHV0ID0gTWF0aC5yb3VuZChvdXRwdXQgKiAxMDApOyAvLyBDb252ZXJ0IHRvIHBlcmNlbnRhZ2VcbiAgICAgICAgXG4gICAgICAgIGxldCBpY29uID0gXCJcdUVFRThcIlxuICAgICAgICBpZiAob3V0cHV0ID09PSAwKSB7XG4gICAgICAgICAgICBpY29uID0gXCJcdUVFRThcIiAvLyBObyB2b2x1bWVcbiAgICAgICAgfSBlbHNlIGlmIChvdXRwdXQgPD0gMzMpIHtcbiAgICAgICAgICAgIGljb24gPSBcIlx1RjAyNlwiIC8vIExvdyB2b2x1bWVcbiAgICAgICAgfSBlbHNlIGlmIChvdXRwdXQgPD0gNjYpIHtcbiAgICAgICAgICAgIGljb24gPSBcIlx1RjAyN1wiIC8vIE1lZGl1bSB2b2x1bWVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGljb24gPSBcIlx1RjAyOFwiIC8vIEhpZ2ggdm9sdW1lXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB7aWNvbjogaWNvbiwgdm9sdW1lOiBgJHtvdXRwdXR9JWB9XG4gICAgfSBjYXRjaCB7XG4gICAgICAgIHJldHVybiB7aWNvbjogXCJcIiwgdm9sdW1lOiBcIkVSUiVcIn1cbiAgICB9XG59KVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBCYXIoZ2RrbW9uaXRvcjogR2RrLk1vbml0b3IpIHtcbiAgICBjb25zdCB7IFRPUCwgTEVGVCwgUklHSFQgfSA9IEFzdGFsLldpbmRvd0FuY2hvclxuXG4gICAgcmV0dXJuIDx3aW5kb3dcbiAgICAgICAgY2xhc3NOYW1lPVwiQmFyXCJcbiAgICAgICAgZ2RrbW9uaXRvcj17Z2RrbW9uaXRvcn1cbiAgICAgICAgZXhjbHVzaXZpdHk9e0FzdGFsLkV4Y2x1c2l2aXR5LkVYQ0xVU0lWRX1cbiAgICAgICAgYW5jaG9yPXtUT1AgfCBMRUZUIHwgUklHSFR9XG4gICAgICAgIGFwcGxpY2F0aW9uPXtBcHB9XG4gICAgICAgIGNoaWxkPXtcbiAgICAgICAgICAgIDxjZW50ZXJib3hcbiAgICAgICAgICAgICAgICBzdGFydFdpZGdldD17XG4gICAgICAgICAgICAgICAgICAgIDxib3ggaGFsaWduPXtHdGsuQWxpZ24uU1RBUlR9IHNwYWNpbmc9ezEyfSBjbGFzc05hbWU9XCJsZWZ0XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8Ym94IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIndvcmtzcGFjZXNcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNwYWNpbmc9ezB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW49e2JpbmQod29ya3NwYWNlc1dpdGhXaW5kb3dzKS5hcyh3b3Jrc3BhY2VzID0+IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3b3Jrc3BhY2VzLm1hcChpZCA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtiaW5kKGFjdGl2ZVdvcmtzcGFjZSkuYXMoYWN0aXZlID0+IGFjdGl2ZSA9PT0gaWQgPyBcIndvcmtzcGFjZSBhY3RpdmVcIiA6IFwid29ya3NwYWNlXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2tlZD17KCkgPT4gaHlwcmxhbmQuZGlzcGF0Y2goXCJ3b3Jrc3BhY2VcIiwgaWQudG9TdHJpbmcoKSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQ9ezxsYWJlbCBsYWJlbD17aWQudG9TdHJpbmcoKX0gLz59XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGxhYmVsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImFjdGl2ZS13aW5kb3dcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsPXtiaW5kKGFjdGl2ZVdpbmRvdyl9XG4gICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICA8L2JveD5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2VudGVyV2lkZ2V0PXtcbiAgICAgICAgICAgICAgICAgICAgPGxhYmVsIFxuICAgICAgICAgICAgICAgICAgICAgICAgaGFsaWduPXtHdGsuQWxpZ24uQ0VOVEVSfSBcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImNsb2NrXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsPXtiaW5kKHRpbWUpfVxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbmRXaWRnZXQ9e1xuICAgICAgICAgICAgICAgICAgICA8Ym94IGhhbGlnbj17R3RrLkFsaWduLkVORH0gc3BhY2luZz17OH0gY2xhc3NOYW1lPVwicmlnaHQgc3lzdGVtLWluZm9cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxib3ggY2xhc3NOYW1lPVwiY3B1XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGxhYmVsPVwiQ1BVIFwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGxhYmVsPXtiaW5kKGNwdVVzYWdlKX0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYm94PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJveCBjbGFzc05hbWU9XCJtZW1vcnlcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGFiZWwgbGFiZWw9XCJNRU0gXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGFiZWwgbGFiZWw9e2JpbmQobWVtb3J5VXNhZ2UpfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9ib3g+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImF1ZGlvXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrZWQ9eygpID0+IGV4ZWNBc3luYyhcInBhdnVjb250cm9sXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkPXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJveD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbCBsYWJlbD17YmluZChhdWRpb1ZvbHVtZSkuYXMoYXVkaW8gPT4gYXVkaW8uaWNvbil9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGFiZWwgbGFiZWw9e2JpbmQoYXVkaW9Wb2x1bWUpLmFzKGF1ZGlvID0+IGAgJHthdWRpby52b2x1bWV9YCl9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYm94PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgIDwvYm94PlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8+XG4gICAgICAgIH1cbiAgICAvPlxufVxuIiwgImltcG9ydCBHdGsgZnJvbSBcImdpOi8vR3RrP3ZlcnNpb249NC4wXCJcbmltcG9ydCB7IHR5cGUgQmluZGFibGVDaGlsZCB9IGZyb20gXCIuL2FzdGFsaWZ5LmpzXCJcbmltcG9ydCB7IG1lcmdlQmluZGluZ3MsIGpzeCBhcyBfanN4IH0gZnJvbSBcIi4uL19hc3RhbC5qc1wiXG5pbXBvcnQgKiBhcyBXaWRnZXQgZnJvbSBcIi4vd2lkZ2V0LmpzXCJcblxuZXhwb3J0IGZ1bmN0aW9uIEZyYWdtZW50KHsgY2hpbGRyZW4gPSBbXSwgY2hpbGQgfToge1xuICAgIGNoaWxkPzogQmluZGFibGVDaGlsZFxuICAgIGNoaWxkcmVuPzogQXJyYXk8QmluZGFibGVDaGlsZD5cbn0pIHtcbiAgICBpZiAoY2hpbGQpIGNoaWxkcmVuLnB1c2goY2hpbGQpXG4gICAgcmV0dXJuIG1lcmdlQmluZGluZ3MoY2hpbGRyZW4pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBqc3goXG4gICAgY3Rvcjoga2V5b2YgdHlwZW9mIGN0b3JzIHwgdHlwZW9mIEd0ay5XaWRnZXQsXG4gICAgcHJvcHM6IGFueSxcbikge1xuICAgIHJldHVybiBfanN4KGN0b3JzLCBjdG9yIGFzIGFueSwgcHJvcHMpXG59XG5cbmNvbnN0IGN0b3JzID0ge1xuICAgIGJveDogV2lkZ2V0LkJveCxcbiAgICBidXR0b246IFdpZGdldC5CdXR0b24sXG4gICAgY2VudGVyYm94OiBXaWRnZXQuQ2VudGVyQm94LFxuICAgIC8vIGNpcmN1bGFycHJvZ3Jlc3M6IFdpZGdldC5DaXJjdWxhclByb2dyZXNzLFxuICAgIC8vIGRyYXdpbmdhcmVhOiBXaWRnZXQuRHJhd2luZ0FyZWEsXG4gICAgZW50cnk6IFdpZGdldC5FbnRyeSxcbiAgICBpbWFnZTogV2lkZ2V0LkltYWdlLFxuICAgIGxhYmVsOiBXaWRnZXQuTGFiZWwsXG4gICAgbGV2ZWxiYXI6IFdpZGdldC5MZXZlbEJhcixcbiAgICBvdmVybGF5OiBXaWRnZXQuT3ZlcmxheSxcbiAgICByZXZlYWxlcjogV2lkZ2V0LlJldmVhbGVyLFxuICAgIHNsaWRlcjogV2lkZ2V0LlNsaWRlcixcbiAgICBzdGFjazogV2lkZ2V0LlN0YWNrLFxuICAgIHN3aXRjaDogV2lkZ2V0LlN3aXRjaCxcbiAgICB3aW5kb3c6IFdpZGdldC5XaW5kb3csXG4gICAgbWVudWJ1dHRvbjogV2lkZ2V0Lk1lbnVCdXR0b24sXG4gICAgcG9wb3ZlcjogV2lkZ2V0LlBvcG92ZXIsXG59XG5cbmRlY2xhcmUgZ2xvYmFsIHtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLW5hbWVzcGFjZVxuICAgIG5hbWVzcGFjZSBKU1gge1xuICAgICAgICB0eXBlIEVsZW1lbnQgPSBHdGsuV2lkZ2V0XG4gICAgICAgIHR5cGUgRWxlbWVudENsYXNzID0gR3RrLldpZGdldFxuICAgICAgICBpbnRlcmZhY2UgSW50cmluc2ljRWxlbWVudHMge1xuICAgICAgICAgICAgYm94OiBXaWRnZXQuQm94UHJvcHNcbiAgICAgICAgICAgIGJ1dHRvbjogV2lkZ2V0LkJ1dHRvblByb3BzXG4gICAgICAgICAgICBjZW50ZXJib3g6IFdpZGdldC5DZW50ZXJCb3hQcm9wc1xuICAgICAgICAgICAgLy8gY2lyY3VsYXJwcm9ncmVzczogV2lkZ2V0LkNpcmN1bGFyUHJvZ3Jlc3NQcm9wc1xuICAgICAgICAgICAgLy8gZHJhd2luZ2FyZWE6IFdpZGdldC5EcmF3aW5nQXJlYVByb3BzXG4gICAgICAgICAgICBlbnRyeTogV2lkZ2V0LkVudHJ5UHJvcHNcbiAgICAgICAgICAgIGltYWdlOiBXaWRnZXQuSW1hZ2VQcm9wc1xuICAgICAgICAgICAgbGFiZWw6IFdpZGdldC5MYWJlbFByb3BzXG4gICAgICAgICAgICBsZXZlbGJhcjogV2lkZ2V0LkxldmVsQmFyUHJvcHNcbiAgICAgICAgICAgIG92ZXJsYXk6IFdpZGdldC5PdmVybGF5UHJvcHNcbiAgICAgICAgICAgIHJldmVhbGVyOiBXaWRnZXQuUmV2ZWFsZXJQcm9wc1xuICAgICAgICAgICAgc2xpZGVyOiBXaWRnZXQuU2xpZGVyUHJvcHNcbiAgICAgICAgICAgIHN0YWNrOiBXaWRnZXQuU3RhY2tQcm9wc1xuICAgICAgICAgICAgc3dpdGNoOiBXaWRnZXQuU3dpdGNoUHJvcHNcbiAgICAgICAgICAgIHdpbmRvdzogV2lkZ2V0LldpbmRvd1Byb3BzXG4gICAgICAgICAgICBtZW51YnV0dG9uOiBXaWRnZXQuTWVudUJ1dHRvblByb3BzXG4gICAgICAgICAgICBwb3BvdmVyOiBXaWRnZXQuUG9wb3ZlclByb3BzXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCBjb25zdCBqc3hzID0ganN4XG4iLCAiaW1wb3J0IHsgQXBwLCBBc3RhbCwgR3RrLCBHZGsgfSBmcm9tIFwiYXN0YWwvZ3RrNFwiXG5pbXBvcnQgeyBWYXJpYWJsZSwgZXhlYywgZXhlY0FzeW5jLCBiaW5kIH0gZnJvbSBcImFzdGFsXCJcblxuaW50ZXJmYWNlIEltYWdlU2FtcGxlIHtcbiAgICBwYXRoOiBzdHJpbmdcbiAgICBzYW1wbGVDb3VudDogbnVtYmVyXG4gICAgbGFzdFNhbXBsZWQ6IG51bWJlclxufVxuXG5jbGFzcyBXZWlnaHRlZEltYWdlU2FtcGxlciB7XG4gICAgcHJpdmF0ZSBpbWFnZXM6IE1hcDxzdHJpbmcsIEltYWdlU2FtcGxlPiA9IG5ldyBNYXAoKVxuICAgIHByaXZhdGUgdG90YWxTYW1wbGVzOiBudW1iZXIgPSAwXG4gICAgcHJpdmF0ZSBpc0xvYWRlZDogYm9vbGVhbiA9IGZhbHNlXG4gICAgcHJpdmF0ZSBvbkxvYWRlZENhbGxiYWNrczogKCgpID0+IHZvaWQpW10gPSBbXVxuICAgIFxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmxvYWRJbWFnZXMoKVxuICAgIH1cbiAgICBcbiAgICBwcml2YXRlIGFzeW5jIGxvYWRJbWFnZXMoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBHZXQgaG9tZSBkaXJlY3RvcnkgZmlyc3RcbiAgICAgICAgICAgIGNvbnN0IGhvbWVEaXIgPSBhd2FpdCBleGVjQXN5bmMoXCJzaCAtYyAnZWNobyAkSE9NRSdcIilcbiAgICAgICAgICAgIGNvbnN0IHdhbGxwYXBlckRpciA9IGAke2hvbWVEaXIudHJpbSgpfS9QaWN0dXJlcy9XYWxscGFwZXJzYFxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBDaGVjayBpZiBkaXJlY3RvcnkgZXhpc3RzIGZpcnN0XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IGV4ZWNBc3luYyhgdGVzdCAtZCBcIiR7d2FsbHBhcGVyRGlyfVwiYClcbiAgICAgICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBXYWxscGFwZXIgZGlyZWN0b3J5ICR7d2FsbHBhcGVyRGlyfSBkb2VzIG5vdCBleGlzdGApXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEZpbmQgaW1hZ2UgZmlsZXNcbiAgICAgICAgICAgIGNvbnN0IG91dHB1dCA9IGF3YWl0IGV4ZWNBc3luYyhgZmluZCBcIiR7d2FsbHBhcGVyRGlyfVwiIC1tYXhkZXB0aCAxIC10eXBlIGYgXFxcXCggLWluYW1lIFwiKi5qcGdcIiAtbyAtaW5hbWUgXCIqLmpwZWdcIiAtbyAtaW5hbWUgXCIqLnBuZ1wiIC1vIC1pbmFtZSBcIioud2VicFwiIC1vIC1pbmFtZSBcIiouYm1wXCIgLW8gLWluYW1lIFwiKi50aWZmXCIgXFxcXClgKVxuICAgICAgICAgICAgY29uc3QgaW1hZ2VGaWxlcyA9IG91dHB1dC50cmltKCkuc3BsaXQoJ1xcbicpLmZpbHRlcihwYXRoID0+IHBhdGgubGVuZ3RoID4gMClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQ2xlYXIgZXhpc3RpbmcgaW1hZ2VzIGFuZCBhZGQgbmV3IG9uZXNcbiAgICAgICAgICAgIHRoaXMuaW1hZ2VzLmNsZWFyKClcbiAgICAgICAgICAgIGZvciAoY29uc3QgZnVsbFBhdGggb2YgaW1hZ2VGaWxlcykge1xuICAgICAgICAgICAgICAgIHRoaXMuaW1hZ2VzLnNldChmdWxsUGF0aCwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBmdWxsUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgc2FtcGxlQ291bnQ6IDAsXG4gICAgICAgICAgICAgICAgICAgIGxhc3RTYW1wbGVkOiAwXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc29sZS5sb2coYExvYWRlZCAke3RoaXMuaW1hZ2VzLnNpemV9IHdhbGxwYXBlciBpbWFnZXNgKVxuICAgICAgICAgICAgdGhpcy5pc0xvYWRlZCA9IHRydWVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gVHJpZ2dlciBjYWxsYmFja3Mgd2hlbiBsb2FkZWRcbiAgICAgICAgICAgIHRoaXMub25Mb2FkZWRDYWxsYmFja3MuZm9yRWFjaChjYWxsYmFjayA9PiBjYWxsYmFjaygpKVxuICAgICAgICAgICAgdGhpcy5vbkxvYWRlZENhbGxiYWNrcyA9IFtdXG4gICAgICAgICAgICBcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBsb2FkaW5nIHdhbGxwYXBlciBpbWFnZXM6XCIsIGVycm9yKVxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIHB1YmxpYyBvbkxvYWRlZChjYWxsYmFjazogKCkgPT4gdm9pZCkge1xuICAgICAgICBpZiAodGhpcy5pc0xvYWRlZCkge1xuICAgICAgICAgICAgY2FsbGJhY2soKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5vbkxvYWRlZENhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKVxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIHByaXZhdGUgY2FsY3VsYXRlV2VpZ2h0KGltYWdlOiBJbWFnZVNhbXBsZSk6IG51bWJlciB7XG4gICAgICAgIC8vIEJhc2Ugd2VpZ2h0IGludmVyc2VseSBwcm9wb3J0aW9uYWwgdG8gc2FtcGxlIGNvdW50XG4gICAgICAgIGNvbnN0IGJhc2VXZWlnaHQgPSAxIC8gKGltYWdlLnNhbXBsZUNvdW50ICsgMSlcbiAgICAgICAgXG4gICAgICAgIC8vIFRpbWUgZGVjYXkgZmFjdG9yIC0gb2xkZXIgc2FtcGxlcyBnZXQgaGlnaGVyIHdlaWdodFxuICAgICAgICBjb25zdCB0aW1lU2luY2VMYXN0U2FtcGxlID0gdGhpcy50b3RhbFNhbXBsZXMgLSBpbWFnZS5sYXN0U2FtcGxlZFxuICAgICAgICBjb25zdCB0aW1lV2VpZ2h0ID0gTWF0aC5sb2codGltZVNpbmNlTGFzdFNhbXBsZSArIDEpICsgMVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGJhc2VXZWlnaHQgKiB0aW1lV2VpZ2h0XG4gICAgfVxuICAgIFxuICAgIC8vIEVmcmFpbWlkaXMtU3BpcmFraXMgYWxnb3JpdGhtIGltcGxlbWVudGF0aW9uXG4gICAgcHVibGljIHNhbXBsZU5leHQoKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgICAgIGlmICh0aGlzLmltYWdlcy5zaXplID09PSAwKSByZXR1cm4gbnVsbFxuICAgICAgICBcbiAgICAgICAgbGV0IG1heEtleSA9IC1JbmZpbml0eVxuICAgICAgICBsZXQgc2VsZWN0ZWRJbWFnZTogSW1hZ2VTYW1wbGUgfCBudWxsID0gbnVsbFxuICAgICAgICBcbiAgICAgICAgZm9yIChjb25zdCBbcGF0aCwgaW1hZ2VdIG9mIHRoaXMuaW1hZ2VzKSB7XG4gICAgICAgICAgICBjb25zdCB3ZWlnaHQgPSB0aGlzLmNhbGN1bGF0ZVdlaWdodChpbWFnZSlcbiAgICAgICAgICAgIGNvbnN0IGtleSA9IE1hdGgucG93KE1hdGgucmFuZG9tKCksIDEgLyB3ZWlnaHQpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChrZXkgPiBtYXhLZXkpIHtcbiAgICAgICAgICAgICAgICBtYXhLZXkgPSBrZXlcbiAgICAgICAgICAgICAgICBzZWxlY3RlZEltYWdlID0gaW1hZ2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHNlbGVjdGVkSW1hZ2UpIHtcbiAgICAgICAgICAgIC8vIFVwZGF0ZSBzYW1wbGluZyBzdGF0aXN0aWNzXG4gICAgICAgICAgICBzZWxlY3RlZEltYWdlLnNhbXBsZUNvdW50KytcbiAgICAgICAgICAgIHNlbGVjdGVkSW1hZ2UubGFzdFNhbXBsZWQgPSB0aGlzLnRvdGFsU2FtcGxlc1xuICAgICAgICAgICAgdGhpcy50b3RhbFNhbXBsZXMrK1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgU2VsZWN0ZWQgd2FsbHBhcGVyOiAke3NlbGVjdGVkSW1hZ2UucGF0aH0gKHNhbXBsZWQgJHtzZWxlY3RlZEltYWdlLnNhbXBsZUNvdW50fSB0aW1lcylgKVxuICAgICAgICAgICAgcmV0dXJuIHNlbGVjdGVkSW1hZ2UucGF0aFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gbnVsbFxuICAgIH1cbiAgICBcbiAgICBwdWJsaWMgYXN5bmMgcmVmcmVzaEltYWdlcygpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5sb2FkSW1hZ2VzKClcbiAgICB9XG59XG5cbi8vIEdsb2JhbCBzYW1wbGVyIGluc3RhbmNlXG5jb25zdCBpbWFnZVNhbXBsZXIgPSBuZXcgV2VpZ2h0ZWRJbWFnZVNhbXBsZXIoKVxuXG4vLyBJbml0aWFsaXplIHdpdGggdGhlIGZpcnN0IHdhbGxwYXBlciBpbW1lZGlhdGVseSwgdGhlbiBwb2xsIGZvciBjaGFuZ2VzXG5jb25zdCBjdXJyZW50V2FsbHBhcGVyID0gVmFyaWFibGU8c3RyaW5nPihcIlwiKVxuXG4vLyBTZXQgaW5pdGlhbCB3YWxscGFwZXIgYXMgc29vbiBhcyBpbWFnZXMgYXJlIGxvYWRlZFxuaW1hZ2VTYW1wbGVyLm9uTG9hZGVkKCgpID0+IHtcbiAgICBjb25zdCBpbml0aWFsSW1hZ2UgPSBpbWFnZVNhbXBsZXIuc2FtcGxlTmV4dCgpXG4gICAgaWYgKGluaXRpYWxJbWFnZSkge1xuICAgICAgICBjdXJyZW50V2FsbHBhcGVyLnNldChpbml0aWFsSW1hZ2UpXG4gICAgICAgIGNvbnNvbGUubG9nKGBJbml0aWFsIHdhbGxwYXBlciBzZXQ6ICR7aW5pdGlhbEltYWdlfWApXG4gICAgfVxufSlcblxuLy8gUG9sbCBmb3Igd2FsbHBhcGVyIGNoYW5nZXMgZXZlcnkgNjAgc2Vjb25kc1xuY3VycmVudFdhbGxwYXBlci5wb2xsKDYwICogMTAwMCwgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IG5leHRJbWFnZSA9IGltYWdlU2FtcGxlci5zYW1wbGVOZXh0KClcbiAgICByZXR1cm4gbmV4dEltYWdlIHx8IGN1cnJlbnRXYWxscGFwZXIuZ2V0KClcbn0pXG5cbi8vIFJlZnJlc2ggaW1hZ2VzIHBlcmlvZGljYWxseSAoY2hlY2sgZm9yIG5ldyBmaWxlcyBldmVyeSA1IG1pbnV0ZXMpXG5jb25zdCBpbWFnZVJlZnJlc2hlciA9IFZhcmlhYmxlKFwiXCIpLnBvbGwoMzAwMDAwLCBhc3luYyAoKSA9PiB7XG4gICAgYXdhaXQgaW1hZ2VTYW1wbGVyLnJlZnJlc2hJbWFnZXMoKVxuICAgIHJldHVybiBcIlwiXG59KVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBXYWxscGFwZXIoZ2RrbW9uaXRvcjogR2RrLk1vbml0b3IpIHtcbiAgICBjb25zdCB7IFRPUCwgTEVGVCwgUklHSFQsIEJPVFRPTSB9ID0gQXN0YWwuV2luZG93QW5jaG9yXG5cbiAgICByZXR1cm4gPHdpbmRvd1xuICAgICAgICBjbGFzc05hbWU9XCJXYWxscGFwZXJcIlxuICAgICAgICBnZGttb25pdG9yPXtnZGttb25pdG9yfVxuICAgICAgICBleGNsdXNpdml0eT17QXN0YWwuRXhjbHVzaXZpdHkuSUdOT1JFfVxuICAgICAgICBhbmNob3I9e1RPUCB8IExFRlQgfCBSSUdIVCB8IEJPVFRPTX1cbiAgICAgICAgbGF5ZXI9e0FzdGFsLkxheWVyLkJBQ0tHUk9VTkR9XG4gICAgICAgIGtleW1vZGU9e0FzdGFsLktleW1vZGUuTk9ORX1cbiAgICAgICAgY2hpbGQ9e1xuICAgICAgICAgICAgPGJveFxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIndhbGxwYXBlci1jb250YWluZXJcIlxuICAgICAgICAgICAgICAgIGNzcz17YmluZChjdXJyZW50V2FsbHBhcGVyKS5hcyhwYXRoID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFwYXRoKSByZXR1cm4gXCJiYWNrZ3JvdW5kOiAjMmUzNDQwO1wiXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBgXG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWltYWdlOiB1cmwoJ2ZpbGU6Ly8ke3BhdGh9Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLXNpemU6IGNvdmVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC1wb3NpdGlvbjogY2VudGVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC1yZXBlYXQ6IG5vLXJlcGVhdDtcbiAgICAgICAgICAgICAgICAgICAgYFxuICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgfVxuICAgIC8+XG59XG4iLCAiaW1wb3J0IHsgQXBwIH0gZnJvbSBcImFzdGFsL2d0azRcIlxuaW1wb3J0IHN0eWxlIGZyb20gXCIuL3N0eWxlLnNjc3NcIlxuaW1wb3J0IEJhciBmcm9tIFwiLi93aWRnZXQvQmFyXCJcbmltcG9ydCBXYWxscGFwZXIgZnJvbSBcIi4vd2lkZ2V0L1dhbGxwYXBlclwiXG5cbkFwcC5zdGFydCh7XG4gICAgY3NzOiBzdHlsZSxcbiAgICBtYWluKCkge1xuICAgICAgICBBcHAuZ2V0X21vbml0b3JzKCkubWFwKEJhcilcbiAgICAgICAgQXBwLmdldF9tb25pdG9ycygpLm1hcChXYWxscGFwZXIpXG4gICAgfSxcbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQUEsT0FBT0EsWUFBVztBQUNsQixPQUFPQyxVQUFTO0FBQ2hCLE9BQU9DLFVBQVM7OztBQ0ZoQixPQUFPQyxZQUFXOzs7QUNBWCxJQUFNLFdBQVcsQ0FBQyxRQUFnQixJQUNwQyxRQUFRLG1CQUFtQixPQUFPLEVBQ2xDLFdBQVcsS0FBSyxHQUFHLEVBQ25CLFlBQVk7QUFFVixJQUFNLFdBQVcsQ0FBQyxRQUFnQixJQUNwQyxRQUFRLG1CQUFtQixPQUFPLEVBQ2xDLFdBQVcsS0FBSyxHQUFHLEVBQ25CLFlBQVk7QUFjVixJQUFNLFVBQU4sTUFBTSxTQUFlO0FBQUEsRUFDaEIsY0FBYyxDQUFDLE1BQVc7QUFBQSxFQUVsQztBQUFBLEVBQ0E7QUFBQSxFQVNBLE9BQU8sS0FBSyxTQUFxQyxNQUFlO0FBQzVELFdBQU8sSUFBSSxTQUFRLFNBQVMsSUFBSTtBQUFBLEVBQ3BDO0FBQUEsRUFFUSxZQUFZLFNBQTRDLE1BQWU7QUFDM0UsU0FBSyxXQUFXO0FBQ2hCLFNBQUssUUFBUSxRQUFRLFNBQVMsSUFBSTtBQUFBLEVBQ3RDO0FBQUEsRUFFQSxXQUFXO0FBQ1AsV0FBTyxXQUFXLEtBQUssUUFBUSxHQUFHLEtBQUssUUFBUSxNQUFNLEtBQUssS0FBSyxNQUFNLEVBQUU7QUFBQSxFQUMzRTtBQUFBLEVBRUEsR0FBTSxJQUFpQztBQUNuQyxVQUFNQyxRQUFPLElBQUksU0FBUSxLQUFLLFVBQVUsS0FBSyxLQUFLO0FBQ2xELElBQUFBLE1BQUssY0FBYyxDQUFDLE1BQWEsR0FBRyxLQUFLLFlBQVksQ0FBQyxDQUFDO0FBQ3ZELFdBQU9BO0FBQUEsRUFDWDtBQUFBLEVBRUEsTUFBYTtBQUNULFFBQUksT0FBTyxLQUFLLFNBQVMsUUFBUTtBQUM3QixhQUFPLEtBQUssWUFBWSxLQUFLLFNBQVMsSUFBSSxDQUFDO0FBRS9DLFFBQUksT0FBTyxLQUFLLFVBQVUsVUFBVTtBQUNoQyxZQUFNLFNBQVMsT0FBTyxTQUFTLEtBQUssS0FBSyxDQUFDO0FBQzFDLFVBQUksT0FBTyxLQUFLLFNBQVMsTUFBTSxNQUFNO0FBQ2pDLGVBQU8sS0FBSyxZQUFZLEtBQUssU0FBUyxNQUFNLEVBQUUsQ0FBQztBQUVuRCxhQUFPLEtBQUssWUFBWSxLQUFLLFNBQVMsS0FBSyxLQUFLLENBQUM7QUFBQSxJQUNyRDtBQUVBLFVBQU0sTUFBTSw4QkFBOEI7QUFBQSxFQUM5QztBQUFBLEVBRUEsVUFBVSxVQUE4QztBQUNwRCxRQUFJLE9BQU8sS0FBSyxTQUFTLGNBQWMsWUFBWTtBQUMvQyxhQUFPLEtBQUssU0FBUyxVQUFVLE1BQU07QUFDakMsaUJBQVMsS0FBSyxJQUFJLENBQUM7QUFBQSxNQUN2QixDQUFDO0FBQUEsSUFDTCxXQUFXLE9BQU8sS0FBSyxTQUFTLFlBQVksWUFBWTtBQUNwRCxZQUFNLFNBQVMsV0FBVyxLQUFLLEtBQUs7QUFDcEMsWUFBTSxLQUFLLEtBQUssU0FBUyxRQUFRLFFBQVEsTUFBTTtBQUMzQyxpQkFBUyxLQUFLLElBQUksQ0FBQztBQUFBLE1BQ3ZCLENBQUM7QUFDRCxhQUFPLE1BQU07QUFDVCxRQUFDLEtBQUssU0FBUyxXQUF5QyxFQUFFO0FBQUEsTUFDOUQ7QUFBQSxJQUNKO0FBQ0EsVUFBTSxNQUFNLEdBQUcsS0FBSyxRQUFRLGtCQUFrQjtBQUFBLEVBQ2xEO0FBQ0o7QUFFTyxJQUFNLEVBQUUsS0FBSyxJQUFJO0FBQ3hCLElBQU8sa0JBQVE7OztBQ3hGZixPQUFPLFdBQVc7QUFHWCxJQUFNLE9BQU8sTUFBTTtBQUVuQixTQUFTLFNBQVNDLFdBQWtCLFVBQXVCO0FBQzlELFNBQU8sTUFBTSxLQUFLLFNBQVNBLFdBQVUsTUFBTSxLQUFLLFdBQVcsQ0FBQztBQUNoRTs7O0FDUEEsT0FBT0MsWUFBVztBQVNYLElBQU0sVUFBVUEsT0FBTTtBQVV0QixTQUFTLFdBQ1osV0FDQSxRQUFrQyxPQUNsQyxRQUFrQyxVQUNwQztBQUNFLFFBQU0sT0FBTyxNQUFNLFFBQVEsU0FBUyxLQUFLLE9BQU8sY0FBYztBQUM5RCxRQUFNLEVBQUUsS0FBSyxLQUFLLElBQUksSUFBSTtBQUFBLElBQ3RCLEtBQUssT0FBTyxZQUFZLFVBQVU7QUFBQSxJQUNsQyxLQUFLLE9BQU8sUUFBUSxVQUFVLE9BQU87QUFBQSxJQUNyQyxLQUFLLE9BQU8sUUFBUSxVQUFVLE9BQU87QUFBQSxFQUN6QztBQUVBLFFBQU0sT0FBTyxNQUFNLFFBQVEsR0FBRyxJQUN4QkEsT0FBTSxRQUFRLFlBQVksR0FBRyxJQUM3QkEsT0FBTSxRQUFRLFdBQVcsR0FBRztBQUVsQyxPQUFLLFFBQVEsVUFBVSxDQUFDLEdBQUcsV0FBbUIsSUFBSSxNQUFNLENBQUM7QUFDekQsT0FBSyxRQUFRLFVBQVUsQ0FBQyxHQUFHLFdBQW1CLElBQUksTUFBTSxDQUFDO0FBQ3pELFNBQU87QUFDWDtBQUdPLFNBQVMsS0FBSyxLQUF3QjtBQUN6QyxTQUFPLE1BQU0sUUFBUSxHQUFHLElBQ2xCQSxPQUFNLFFBQVEsTUFBTSxHQUFHLElBQ3ZCQSxPQUFNLFFBQVEsS0FBSyxHQUFHO0FBQ2hDO0FBRU8sU0FBUyxVQUFVLEtBQXlDO0FBQy9ELFNBQU8sSUFBSSxRQUFRLENBQUMsU0FBUyxXQUFXO0FBQ3BDLFFBQUksTUFBTSxRQUFRLEdBQUcsR0FBRztBQUNwQixNQUFBQSxPQUFNLFFBQVEsWUFBWSxLQUFLLENBQUMsR0FBRyxRQUFRO0FBQ3ZDLFlBQUk7QUFDQSxrQkFBUUEsT0FBTSxRQUFRLG1CQUFtQixHQUFHLENBQUM7QUFBQSxRQUNqRCxTQUFTLE9BQU87QUFDWixpQkFBTyxLQUFLO0FBQUEsUUFDaEI7QUFBQSxNQUNKLENBQUM7QUFBQSxJQUNMLE9BQU87QUFDSCxNQUFBQSxPQUFNLFFBQVEsV0FBVyxLQUFLLENBQUMsR0FBRyxRQUFRO0FBQ3RDLFlBQUk7QUFDQSxrQkFBUUEsT0FBTSxRQUFRLFlBQVksR0FBRyxDQUFDO0FBQUEsUUFDMUMsU0FBUyxPQUFPO0FBQ1osaUJBQU8sS0FBSztBQUFBLFFBQ2hCO0FBQUEsTUFDSixDQUFDO0FBQUEsSUFDTDtBQUFBLEVBQ0osQ0FBQztBQUNMOzs7QUg5REEsSUFBTSxrQkFBTixjQUFpQyxTQUFTO0FBQUEsRUFDOUI7QUFBQSxFQUNBLGFBQWMsUUFBUTtBQUFBLEVBRXRCO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBLGVBQWU7QUFBQSxFQUNmO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUEsRUFDQTtBQUFBLEVBRVIsWUFBWSxNQUFTO0FBQ2pCLFVBQU07QUFDTixTQUFLLFNBQVM7QUFDZCxTQUFLLFdBQVcsSUFBSUMsT0FBTSxhQUFhO0FBQ3ZDLFNBQUssU0FBUyxRQUFRLFdBQVcsTUFBTTtBQUNuQyxXQUFLLFVBQVU7QUFDZixXQUFLLFNBQVM7QUFBQSxJQUNsQixDQUFDO0FBQ0QsU0FBSyxTQUFTLFFBQVEsU0FBUyxDQUFDLEdBQUcsUUFBUSxLQUFLLGFBQWEsR0FBRyxDQUFDO0FBQ2pFLFdBQU8sSUFBSSxNQUFNLE1BQU07QUFBQSxNQUNuQixPQUFPLENBQUMsUUFBUSxHQUFHLFNBQVMsT0FBTyxNQUFNLEtBQUssQ0FBQyxDQUFDO0FBQUEsSUFDcEQsQ0FBQztBQUFBLEVBQ0w7QUFBQSxFQUVRLE1BQWEsV0FBeUM7QUFDMUQsVUFBTSxJQUFJLGdCQUFRLEtBQUssSUFBSTtBQUMzQixXQUFPLFlBQVksRUFBRSxHQUFHLFNBQVMsSUFBSTtBQUFBLEVBQ3pDO0FBQUEsRUFFQSxXQUFXO0FBQ1AsV0FBTyxPQUFPLFlBQVksS0FBSyxJQUFJLENBQUMsR0FBRztBQUFBLEVBQzNDO0FBQUEsRUFFQSxNQUFTO0FBQUUsV0FBTyxLQUFLO0FBQUEsRUFBTztBQUFBLEVBQzlCLElBQUksT0FBVTtBQUNWLFFBQUksVUFBVSxLQUFLLFFBQVE7QUFDdkIsV0FBSyxTQUFTO0FBQ2QsV0FBSyxTQUFTLEtBQUssU0FBUztBQUFBLElBQ2hDO0FBQUEsRUFDSjtBQUFBLEVBRUEsWUFBWTtBQUNSLFFBQUksS0FBSztBQUNMO0FBRUosUUFBSSxLQUFLLFFBQVE7QUFDYixXQUFLLFFBQVEsU0FBUyxLQUFLLGNBQWMsTUFBTTtBQUMzQyxjQUFNLElBQUksS0FBSyxPQUFRLEtBQUssSUFBSSxDQUFDO0FBQ2pDLFlBQUksYUFBYSxTQUFTO0FBQ3RCLFlBQUUsS0FBSyxDQUFBQyxPQUFLLEtBQUssSUFBSUEsRUFBQyxDQUFDLEVBQ2xCLE1BQU0sU0FBTyxLQUFLLFNBQVMsS0FBSyxTQUFTLEdBQUcsQ0FBQztBQUFBLFFBQ3RELE9BQU87QUFDSCxlQUFLLElBQUksQ0FBQztBQUFBLFFBQ2Q7QUFBQSxNQUNKLENBQUM7QUFBQSxJQUNMLFdBQVcsS0FBSyxVQUFVO0FBQ3RCLFdBQUssUUFBUSxTQUFTLEtBQUssY0FBYyxNQUFNO0FBQzNDLGtCQUFVLEtBQUssUUFBUyxFQUNuQixLQUFLLE9BQUssS0FBSyxJQUFJLEtBQUssY0FBZSxHQUFHLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUN0RCxNQUFNLFNBQU8sS0FBSyxTQUFTLEtBQUssU0FBUyxHQUFHLENBQUM7QUFBQSxNQUN0RCxDQUFDO0FBQUEsSUFDTDtBQUFBLEVBQ0o7QUFBQSxFQUVBLGFBQWE7QUFDVCxRQUFJLEtBQUs7QUFDTDtBQUVKLFNBQUssU0FBUyxXQUFXO0FBQUEsTUFDckIsS0FBSyxLQUFLO0FBQUEsTUFDVixLQUFLLFNBQU8sS0FBSyxJQUFJLEtBQUssZUFBZ0IsS0FBSyxLQUFLLElBQUksQ0FBQyxDQUFDO0FBQUEsTUFDMUQsS0FBSyxTQUFPLEtBQUssU0FBUyxLQUFLLFNBQVMsR0FBRztBQUFBLElBQy9DLENBQUM7QUFBQSxFQUNMO0FBQUEsRUFFQSxXQUFXO0FBQ1AsU0FBSyxPQUFPLE9BQU87QUFDbkIsV0FBTyxLQUFLO0FBQUEsRUFDaEI7QUFBQSxFQUVBLFlBQVk7QUFDUixTQUFLLFFBQVEsS0FBSztBQUNsQixXQUFPLEtBQUs7QUFBQSxFQUNoQjtBQUFBLEVBRUEsWUFBWTtBQUFFLFdBQU8sQ0FBQyxDQUFDLEtBQUs7QUFBQSxFQUFNO0FBQUEsRUFDbEMsYUFBYTtBQUFFLFdBQU8sQ0FBQyxDQUFDLEtBQUs7QUFBQSxFQUFPO0FBQUEsRUFFcEMsT0FBTztBQUNILFNBQUssU0FBUyxLQUFLLFNBQVM7QUFBQSxFQUNoQztBQUFBLEVBRUEsVUFBVSxVQUFzQjtBQUM1QixTQUFLLFNBQVMsUUFBUSxXQUFXLFFBQVE7QUFDekMsV0FBTztBQUFBLEVBQ1g7QUFBQSxFQUVBLFFBQVEsVUFBaUM7QUFDckMsV0FBTyxLQUFLO0FBQ1osU0FBSyxTQUFTLFFBQVEsU0FBUyxDQUFDLEdBQUcsUUFBUSxTQUFTLEdBQUcsQ0FBQztBQUN4RCxXQUFPO0FBQUEsRUFDWDtBQUFBLEVBRUEsVUFBVSxVQUE4QjtBQUNwQyxVQUFNLEtBQUssS0FBSyxTQUFTLFFBQVEsV0FBVyxNQUFNO0FBQzlDLGVBQVMsS0FBSyxJQUFJLENBQUM7QUFBQSxJQUN2QixDQUFDO0FBQ0QsV0FBTyxNQUFNLEtBQUssU0FBUyxXQUFXLEVBQUU7QUFBQSxFQUM1QztBQUFBLEVBYUEsS0FDSUMsV0FDQUMsT0FDQSxZQUE0QyxTQUFPLEtBQ3JEO0FBQ0UsU0FBSyxTQUFTO0FBQ2QsU0FBSyxlQUFlRDtBQUNwQixTQUFLLGdCQUFnQjtBQUNyQixRQUFJLE9BQU9DLFVBQVMsWUFBWTtBQUM1QixXQUFLLFNBQVNBO0FBQ2QsYUFBTyxLQUFLO0FBQUEsSUFDaEIsT0FBTztBQUNILFdBQUssV0FBV0E7QUFDaEIsYUFBTyxLQUFLO0FBQUEsSUFDaEI7QUFDQSxTQUFLLFVBQVU7QUFDZixXQUFPO0FBQUEsRUFDWDtBQUFBLEVBRUEsTUFDSUEsT0FDQSxZQUE0QyxTQUFPLEtBQ3JEO0FBQ0UsU0FBSyxVQUFVO0FBQ2YsU0FBSyxZQUFZQTtBQUNqQixTQUFLLGlCQUFpQjtBQUN0QixTQUFLLFdBQVc7QUFDaEIsV0FBTztBQUFBLEVBQ1g7QUFBQSxFQWFBLFFBQ0ksTUFDQSxTQUNBLFVBQ0Y7QUFDRSxVQUFNLElBQUksT0FBTyxZQUFZLGFBQWEsVUFBVSxhQUFhLE1BQU0sS0FBSyxJQUFJO0FBQ2hGLFVBQU0sTUFBTSxDQUFDLFFBQXFCLFNBQWdCLEtBQUssSUFBSSxFQUFFLEtBQUssR0FBRyxJQUFJLENBQUM7QUFFMUUsUUFBSSxNQUFNLFFBQVEsSUFBSSxHQUFHO0FBQ3JCLGlCQUFXLE9BQU8sTUFBTTtBQUNwQixjQUFNLENBQUMsR0FBRyxDQUFDLElBQUk7QUFDZixjQUFNLEtBQUssRUFBRSxRQUFRLEdBQUcsR0FBRztBQUMzQixhQUFLLFVBQVUsTUFBTSxFQUFFLFdBQVcsRUFBRSxDQUFDO0FBQUEsTUFDekM7QUFBQSxJQUNKLE9BQU87QUFDSCxVQUFJLE9BQU8sWUFBWSxVQUFVO0FBQzdCLGNBQU0sS0FBSyxLQUFLLFFBQVEsU0FBUyxHQUFHO0FBQ3BDLGFBQUssVUFBVSxNQUFNLEtBQUssV0FBVyxFQUFFLENBQUM7QUFBQSxNQUM1QztBQUFBLElBQ0o7QUFFQSxXQUFPO0FBQUEsRUFDWDtBQUFBLEVBRUEsT0FBTyxPQU1MLE1BQVksS0FBMkIsSUFBSSxTQUFTLE1BQXNCO0FBQ3hFLFVBQU0sU0FBUyxNQUFNLEdBQUcsR0FBRyxLQUFLLElBQUksT0FBSyxFQUFFLElBQUksQ0FBQyxDQUFTO0FBQ3pELFVBQU0sVUFBVSxJQUFJLFNBQVMsT0FBTyxDQUFDO0FBQ3JDLFVBQU0sU0FBUyxLQUFLLElBQUksU0FBTyxJQUFJLFVBQVUsTUFBTSxRQUFRLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQztBQUN6RSxZQUFRLFVBQVUsTUFBTSxPQUFPLElBQUksV0FBUyxNQUFNLENBQUMsQ0FBQztBQUNwRCxXQUFPO0FBQUEsRUFDWDtBQUNKO0FBT08sSUFBTSxXQUFXLElBQUksTUFBTSxpQkFBd0I7QUFBQSxFQUN0RCxPQUFPLENBQUMsSUFBSSxJQUFJLFNBQVMsSUFBSSxnQkFBZ0IsS0FBSyxDQUFDLENBQUM7QUFDeEQsQ0FBQztBQU1NLElBQU0sRUFBRSxPQUFPLElBQUk7QUFDMUIsSUFBTyxtQkFBUTs7O0FJOU5SLElBQU0sb0JBQW9CLE9BQU8sd0JBQXdCO0FBQ3pELElBQU0sY0FBYyxPQUFPLHdCQUF3QjtBQUVuRCxTQUFTLGNBQWMsT0FBYztBQUN4QyxXQUFTLGFBQWEsTUFBYTtBQUMvQixRQUFJLElBQUk7QUFDUixXQUFPLE1BQU07QUFBQSxNQUFJLFdBQVMsaUJBQWlCLGtCQUNyQyxLQUFLLEdBQUcsSUFDUjtBQUFBLElBQ047QUFBQSxFQUNKO0FBRUEsUUFBTSxXQUFXLE1BQU0sT0FBTyxPQUFLLGFBQWEsZUFBTztBQUV2RCxNQUFJLFNBQVMsV0FBVztBQUNwQixXQUFPO0FBRVgsTUFBSSxTQUFTLFdBQVc7QUFDcEIsV0FBTyxTQUFTLENBQUMsRUFBRSxHQUFHLFNBQVM7QUFFbkMsU0FBTyxpQkFBUyxPQUFPLFVBQVUsU0FBUyxFQUFFO0FBQ2hEO0FBRU8sU0FBUyxRQUFRLEtBQVUsTUFBYyxPQUFZO0FBQ3hELE1BQUk7QUFDQSxVQUFNLFNBQVMsT0FBTyxTQUFTLElBQUksQ0FBQztBQUNwQyxRQUFJLE9BQU8sSUFBSSxNQUFNLE1BQU07QUFDdkIsYUFBTyxJQUFJLE1BQU0sRUFBRSxLQUFLO0FBRTVCLFdBQVEsSUFBSSxJQUFJLElBQUk7QUFBQSxFQUN4QixTQUFTLE9BQU87QUFDWixZQUFRLE1BQU0sMkJBQTJCLElBQUksUUFBUSxHQUFHLEtBQUssS0FBSztBQUFBLEVBQ3RFO0FBQ0o7QUEyQk8sU0FBUyxVQUFxRixRQUFnQixRQUFhO0FBRTlILE1BQUksRUFBRSxPQUFPLE9BQU8sV0FBVyxDQUFDLEdBQUcsR0FBRyxNQUFNLElBQUk7QUFFaEQsTUFBSSxvQkFBb0IsaUJBQVM7QUFDN0IsZUFBVyxDQUFDLFFBQVE7QUFBQSxFQUN4QjtBQUVBLE1BQUksT0FBTztBQUNQLGFBQVMsUUFBUSxLQUFLO0FBQUEsRUFDMUI7QUFHQSxhQUFXLENBQUMsS0FBSyxLQUFLLEtBQUssT0FBTyxRQUFRLEtBQUssR0FBRztBQUM5QyxRQUFJLFVBQVUsUUFBVztBQUNyQixhQUFPLE1BQU0sR0FBRztBQUFBLElBQ3BCO0FBQUEsRUFDSjtBQUdBLFFBQU0sV0FBMEMsT0FDM0MsS0FBSyxLQUFLLEVBQ1YsT0FBTyxDQUFDLEtBQVUsU0FBUztBQUN4QixRQUFJLE1BQU0sSUFBSSxhQUFhLGlCQUFTO0FBQ2hDLFlBQU0sVUFBVSxNQUFNLElBQUk7QUFDMUIsYUFBTyxNQUFNLElBQUk7QUFDakIsYUFBTyxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sT0FBTyxDQUFDO0FBQUEsSUFDbkM7QUFDQSxXQUFPO0FBQUEsRUFDWCxHQUFHLENBQUMsQ0FBQztBQUdULFFBQU0sYUFBd0QsT0FDekQsS0FBSyxLQUFLLEVBQ1YsT0FBTyxDQUFDLEtBQVUsUUFBUTtBQUN2QixRQUFJLElBQUksV0FBVyxJQUFJLEdBQUc7QUFDdEIsWUFBTSxNQUFNLFNBQVMsR0FBRyxFQUFFLE1BQU0sR0FBRyxFQUFFLE1BQU0sQ0FBQyxFQUFFLEtBQUssR0FBRztBQUN0RCxZQUFNLFVBQVUsTUFBTSxHQUFHO0FBQ3pCLGFBQU8sTUFBTSxHQUFHO0FBQ2hCLGFBQU8sQ0FBQyxHQUFHLEtBQUssQ0FBQyxLQUFLLE9BQU8sQ0FBQztBQUFBLElBQ2xDO0FBQ0EsV0FBTztBQUFBLEVBQ1gsR0FBRyxDQUFDLENBQUM7QUFHVCxRQUFNLGlCQUFpQixjQUFjLFNBQVMsS0FBSyxRQUFRLENBQUM7QUFDNUQsTUFBSSwwQkFBMEIsaUJBQVM7QUFDbkMsV0FBTyxXQUFXLEVBQUUsZUFBZSxJQUFJLENBQUM7QUFDeEMsV0FBTyxRQUFRLFdBQVcsZUFBZSxVQUFVLENBQUMsTUFBTTtBQUN0RCxhQUFPLFdBQVcsRUFBRSxDQUFDO0FBQUEsSUFDekIsQ0FBQyxDQUFDO0FBQUEsRUFDTixPQUFPO0FBQ0gsUUFBSSxlQUFlLFNBQVMsR0FBRztBQUMzQixhQUFPLFdBQVcsRUFBRSxjQUFjO0FBQUEsSUFDdEM7QUFBQSxFQUNKO0FBR0EsYUFBVyxDQUFDLFFBQVEsUUFBUSxLQUFLLFlBQVk7QUFDekMsVUFBTSxNQUFNLE9BQU8sV0FBVyxRQUFRLElBQ2hDLE9BQU8sUUFBUSxLQUFLLElBQUksSUFDeEI7QUFFTixRQUFJLE9BQU8sYUFBYSxZQUFZO0FBQ2hDLGFBQU8sUUFBUSxLQUFLLFFBQVE7QUFBQSxJQUNoQyxPQUFPO0FBQ0gsYUFBTyxRQUFRLEtBQUssTUFBTSxVQUFVLFFBQVEsRUFDdkMsS0FBSyxLQUFLLEVBQUUsTUFBTSxRQUFRLEtBQUssQ0FBQztBQUFBLElBQ3pDO0FBQUEsRUFDSjtBQUdBLGFBQVcsQ0FBQyxNQUFNLE9BQU8sS0FBSyxVQUFVO0FBQ3BDLFFBQUksU0FBUyxXQUFXLFNBQVMsWUFBWTtBQUN6QyxhQUFPLFFBQVEsV0FBVyxRQUFRLFVBQVUsQ0FBQyxNQUFXO0FBQ3BELGVBQU8sV0FBVyxFQUFFLENBQUM7QUFBQSxNQUN6QixDQUFDLENBQUM7QUFBQSxJQUNOO0FBQ0EsV0FBTyxRQUFRLFdBQVcsUUFBUSxVQUFVLENBQUMsTUFBVztBQUNwRCxjQUFRLFFBQVEsTUFBTSxDQUFDO0FBQUEsSUFDM0IsQ0FBQyxDQUFDO0FBQ0YsWUFBUSxRQUFRLE1BQU0sUUFBUSxJQUFJLENBQUM7QUFBQSxFQUN2QztBQUdBLGFBQVcsQ0FBQyxLQUFLLEtBQUssS0FBSyxPQUFPLFFBQVEsS0FBSyxHQUFHO0FBQzlDLFFBQUksVUFBVSxRQUFXO0FBQ3JCLGFBQU8sTUFBTSxHQUFHO0FBQUEsSUFDcEI7QUFBQSxFQUNKO0FBRUEsU0FBTyxPQUFPLFFBQVEsS0FBSztBQUMzQixVQUFRLE1BQU07QUFDZCxTQUFPO0FBQ1g7QUFFQSxTQUFTLGdCQUFnQixNQUF1QztBQUM1RCxTQUFPLENBQUMsT0FBTyxPQUFPLE1BQU0sV0FBVztBQUMzQztBQUVPLFNBQVMsSUFDWkMsUUFDQSxNQUNBLEVBQUUsVUFBVSxHQUFHLE1BQU0sR0FDdkI7QUFDRSxlQUFhLENBQUM7QUFFZCxNQUFJLENBQUMsTUFBTSxRQUFRLFFBQVE7QUFDdkIsZUFBVyxDQUFDLFFBQVE7QUFFeEIsYUFBVyxTQUFTLE9BQU8sT0FBTztBQUVsQyxNQUFJLFNBQVMsV0FBVztBQUNwQixVQUFNLFFBQVEsU0FBUyxDQUFDO0FBQUEsV0FDbkIsU0FBUyxTQUFTO0FBQ3ZCLFVBQU0sV0FBVztBQUVyQixNQUFJLE9BQU8sU0FBUyxVQUFVO0FBQzFCLFFBQUksZ0JBQWdCQSxPQUFNLElBQUksQ0FBQztBQUMzQixhQUFPQSxPQUFNLElBQUksRUFBRSxLQUFLO0FBRTVCLFdBQU8sSUFBSUEsT0FBTSxJQUFJLEVBQUUsS0FBSztBQUFBLEVBQ2hDO0FBRUEsTUFBSSxnQkFBZ0IsSUFBSTtBQUNwQixXQUFPLEtBQUssS0FBSztBQUVyQixTQUFPLElBQUksS0FBSyxLQUFLO0FBQ3pCOzs7QUMvTEEsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sU0FBUztBQUdULElBQU0sT0FBTyxPQUFPLFlBQVk7QUFDdkMsSUFBTSxjQUFjLElBQUksSUFBSTtBQUU1QixTQUFTLGFBQWEsUUFBdUM7QUFDekQsTUFBSSxlQUFlLFVBQVUsT0FBTyxPQUFPLGFBQWEsWUFBWTtBQUNoRSxXQUFPLE9BQU8sVUFBVSxJQUFJLENBQUMsT0FBTyxVQUFVLENBQUMsSUFBSSxDQUFDO0FBQUEsRUFDeEQ7QUFFQSxRQUFNLFdBQThCLENBQUM7QUFDckMsTUFBSSxLQUFLLE9BQU8sZ0JBQWdCO0FBQ2hDLFNBQU8sT0FBTyxNQUFNO0FBQ2hCLGFBQVMsS0FBSyxFQUFFO0FBQ2hCLFNBQUssR0FBRyxpQkFBaUI7QUFBQSxFQUM3QjtBQUNBLFNBQU87QUFDWDtBQUVBLFNBQVMsYUFBYSxRQUFvQixVQUFpQjtBQUN2RCxhQUFXLFNBQVMsS0FBSyxRQUFRLEVBQUUsSUFBSSxRQUFNLGNBQWMsSUFBSSxTQUN6RCxLQUNBLElBQUksSUFBSSxNQUFNLEVBQUUsU0FBUyxNQUFNLE9BQU8sT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBR3pELGFBQVcsU0FBUyxVQUFVO0FBQzFCLFdBQU87QUFBQSxNQUNIO0FBQUEsTUFDQTtBQUFBLE1BQ0EsUUFBUSxRQUFRLE1BQU0sSUFBSSxJQUFJO0FBQUEsSUFDbEM7QUFBQSxFQUNKO0FBQ0o7QUFPZSxTQUFSLFNBSUwsS0FBc0MsU0FBa0MsQ0FBQyxHQUFHO0FBQzFFLFNBQU8sT0FBTyxJQUFJLFdBQVc7QUFBQSxJQUN6QixDQUFDLFdBQVcsRUFBRSxVQUFpQjtBQUMzQixZQUFNLElBQUk7QUFDVixpQkFBVyxTQUFVLE9BQU8sY0FBYyxDQUFDLEtBQUssYUFBYSxDQUFDLEdBQUk7QUFDOUQsWUFBSSxpQkFBaUIsSUFBSSxRQUFRO0FBQzdCLGdCQUFNLFNBQVM7QUFDZixjQUFJLENBQUMsU0FBUyxTQUFTLEtBQUssS0FBSyxxQkFBcUI7QUFDbEQsa0JBQU0sWUFBWTtBQUFBLFFBQzFCO0FBQUEsTUFDSjtBQUVBLFVBQUksT0FBTyxhQUFhO0FBQ3BCLGVBQU8sWUFBWSxHQUFHLFFBQVE7QUFBQSxNQUNsQyxPQUFPO0FBQ0gscUJBQWEsR0FBRyxRQUFRO0FBQUEsTUFDNUI7QUFBQSxJQUNKO0FBQUEsRUFDSixDQUFDO0FBRUQsU0FBTztBQUFBLElBQ0gsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUNSLFFBQWdELENBQUMsTUFDOUMsYUFDTTtBQUNULFlBQU0sU0FBUyxJQUFJLElBQUksYUFBYSxRQUFRLEVBQUUsU0FBUyxNQUFNLFFBQVEsSUFBSSxDQUFDLENBQUM7QUFFM0UsVUFBSSxhQUFhLE9BQU87QUFDcEIsZUFBTyxNQUFNO0FBQUEsTUFDakI7QUFFQSxVQUFJLE1BQU0sbUJBQW1CO0FBQ3pCLGVBQU8sT0FBTyxRQUFRLEVBQUUsQ0FBQyxpQkFBaUIsR0FBRyxLQUFLLENBQUM7QUFDbkQsZUFBTyxNQUFNO0FBQUEsTUFDakI7QUFFQSxVQUFJLE1BQU0sTUFBTTtBQUNaLGVBQU8sT0FBTyxRQUFRLEVBQUUsQ0FBQyxJQUFJLEdBQUcsTUFBTSxLQUFLLENBQUM7QUFDNUMsZUFBTyxNQUFNO0FBQUEsTUFDakI7QUFFQSxVQUFJLFNBQVMsU0FBUyxHQUFHO0FBQ3JCLGVBQU8sT0FBTyxPQUFPLEVBQUUsU0FBUyxDQUFDO0FBQUEsTUFDckM7QUFFQSxhQUFPLFVBQVUsUUFBZSxpQkFBaUIsUUFBUSxLQUFZLENBQUM7QUFBQSxJQUMxRTtBQUFBLEVBQ0osRUFBRSxJQUFJLElBQUk7QUFDZDtBQWdEQSxTQUFTLGlCQUFvQixRQUFvQjtBQUFBLEVBQzdDO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQSxHQUFHO0FBQ1AsR0FBb0M7QUFDaEMsTUFBSSxnQkFBZ0IsY0FBYztBQUM5QixVQUFNLFFBQVEsSUFBSSxJQUFJO0FBQ3RCLFdBQU8sZUFBZSxLQUFLO0FBRTNCLFFBQUk7QUFDQSxZQUFNLFFBQVEsU0FBUyxNQUFNLGFBQWEsTUFBTSxDQUFDO0FBRXJELFFBQUk7QUFDQSxZQUFNLFFBQVEsU0FBUyxNQUFNLGFBQWEsTUFBTSxDQUFDO0FBQUEsRUFDekQ7QUFFQSxNQUFJLGdCQUFnQixpQkFBaUIsZUFBZTtBQUNoRCxVQUFNLE1BQU0sSUFBSSxJQUFJO0FBQ3BCLFdBQU8sZUFBZSxHQUFHO0FBRXpCLFFBQUk7QUFDQSxVQUFJLFFBQVEsZUFBZSxDQUFDLEdBQUcsS0FBSyxNQUFNLFVBQVUsYUFBYSxRQUFRLEtBQUssTUFBTSxLQUFLLENBQUM7QUFFOUYsUUFBSTtBQUNBLFVBQUksUUFBUSxnQkFBZ0IsQ0FBQyxHQUFHLEtBQUssTUFBTSxVQUFVLGNBQWMsUUFBUSxLQUFLLE1BQU0sS0FBSyxDQUFDO0FBRWhHLFFBQUk7QUFDQSxVQUFJLFFBQVEsYUFBYSxDQUFDLEdBQUcsVUFBVSxjQUFjLFFBQVEsS0FBSyxDQUFDO0FBQUEsRUFDM0U7QUFFQSxNQUFJLFlBQVksbUJBQW1CLGtCQUFrQjtBQUNqRCxVQUFNLFNBQVMsSUFBSSxJQUFJO0FBQ3ZCLFdBQU8sZUFBZSxNQUFNO0FBRTVCLFdBQU8sUUFBUSxTQUFTLENBQUMsR0FBRyxVQUFVO0FBQ2xDLFVBQUksTUFBTSxlQUFlLE1BQU0sSUFBSSxVQUFVLGNBQWM7QUFDdkQsMEJBQWtCLFFBQVEsS0FBd0I7QUFBQSxNQUN0RDtBQUVBLFVBQUksTUFBTSxlQUFlLE1BQU0sSUFBSSxVQUFVLGdCQUFnQjtBQUN6RCwyQkFBbUIsUUFBUSxLQUF3QjtBQUFBLE1BQ3ZEO0FBRUEsaUJBQVcsUUFBUSxLQUFLO0FBQUEsSUFDNUIsQ0FBQztBQUFBLEVBQ0w7QUFFQSxNQUFJLFlBQVksZ0JBQWdCLGNBQWM7QUFDMUMsVUFBTSxRQUFRLElBQUksSUFBSTtBQUN0QixXQUFPLGVBQWUsS0FBSztBQUUzQixRQUFJO0FBQ0EsWUFBTSxRQUFRLFNBQVMsQ0FBQyxHQUFHLEdBQUcsTUFBTSxhQUFhLFFBQVEsR0FBRyxDQUFDLENBQUM7QUFFbEUsUUFBSTtBQUNBLFlBQU0sUUFBUSxTQUFTLE1BQU0sYUFBYSxNQUFNLENBQUM7QUFFckQsUUFBSTtBQUNBLFlBQU0sUUFBUSxVQUFVLENBQUMsR0FBRyxHQUFHLE1BQU0sU0FBUyxRQUFRLEdBQUcsQ0FBQyxDQUFDO0FBQUEsRUFDbkU7QUFFQSxNQUFJLFlBQVksb0JBQW9CO0FBQ2hDLFVBQU0sU0FBUyxJQUFJLElBQUk7QUFDdkIsV0FBTyxRQUFRLElBQUksMkJBQTJCLFlBQVksSUFBSSwyQkFBMkI7QUFDekYsV0FBTyxlQUFlLE1BQU07QUFFNUIsUUFBSTtBQUNBLGFBQU8sUUFBUSxVQUFVLENBQUMsR0FBRyxHQUFHLE1BQU0sU0FBUyxRQUFRLEdBQUcsQ0FBQyxDQUFDO0FBRWhFLFFBQUk7QUFDQSxhQUFPLFFBQVEsY0FBYyxDQUFDLEdBQUcsR0FBRyxNQUFNLG1CQUFtQixRQUFRLEdBQUcsQ0FBQyxDQUFDO0FBQUEsRUFDbEY7QUFFQSxTQUFPO0FBQ1g7OztBQ25PQSxPQUFPLFVBQVU7QUFDakIsT0FBT0MsVUFBUztBQUNoQixPQUFPQyxZQUFXOzs7QUNJbEIsSUFBTUMsWUFBVyxDQUFDLFFBQWdCLElBQzdCLFFBQVEsbUJBQW1CLE9BQU8sRUFDbEMsV0FBVyxLQUFLLEdBQUcsRUFDbkIsWUFBWTtBQUVqQixlQUFlLFNBQVksS0FBOEJDLFFBQXVCO0FBQzVFLFNBQU8sSUFBSSxLQUFLLE9BQUtBLE9BQU0sRUFBRSxPQUFPLENBQUMsRUFBRSxNQUFNLE1BQU0sTUFBTTtBQUM3RDtBQUVBLFNBQVMsTUFBd0IsT0FBVSxNQUFnQztBQUN2RSxTQUFPLGVBQWUsT0FBTyxNQUFNO0FBQUEsSUFDL0IsTUFBTTtBQUFFLGFBQU8sS0FBSyxPQUFPRCxVQUFTLElBQUksQ0FBQyxFQUFFLEVBQUU7QUFBQSxJQUFFO0FBQUEsRUFDbkQsQ0FBQztBQUNMO0FBRUEsTUFBTSxTQUFTLE9BQU8sZ0JBQWdCLEdBQUcsQ0FBQyxFQUFFLE1BQU0sWUFBWSxNQUFNO0FBQ2hFLFFBQU0sS0FBSyxXQUFXLE1BQU07QUFDNUIsUUFBTSxZQUFZLFdBQVcsVUFBVTtBQUN2QyxRQUFNLFlBQVksV0FBVyxZQUFZO0FBQzdDLENBQUM7QUFFRCxNQUFNLFNBQVMsT0FBTyxtQkFBbUIsR0FBRyxDQUFDLEVBQUUsT0FBTyxNQUFNO0FBQ3hELFFBQU0sT0FBTyxXQUFXLFNBQVM7QUFDckMsQ0FBQztBQUVELE1BQU0sU0FBUyxPQUFPLHFCQUFxQixHQUFHLENBQUMsRUFBRSxTQUFTLFdBQVcsT0FBTyxNQUFNO0FBQzlFLFFBQU0sUUFBUSxXQUFXLE9BQU87QUFDaEMsUUFBTSxVQUFVLFdBQVcsVUFBVTtBQUNyQyxRQUFNLFVBQVUsV0FBVyxTQUFTO0FBQ3BDLFFBQU0sT0FBTyxXQUFXLE9BQU87QUFDbkMsQ0FBQztBQUVELE1BQU0sU0FBUyxPQUFPLG9CQUFvQixHQUFHLENBQUMsRUFBRSxVQUFBRSxXQUFVLFNBQVMsVUFBVSxNQUFNO0FBQy9FLFFBQU1BLFVBQVMsV0FBVyxPQUFPO0FBQ2pDLFFBQU1BLFVBQVMsV0FBVyxVQUFVO0FBQ3BDLFFBQU1BLFVBQVMsV0FBVyxZQUFZO0FBQ3RDLFFBQU1BLFVBQVMsV0FBVyxTQUFTO0FBQ25DLFFBQU0sUUFBUSxXQUFXLGdCQUFnQjtBQUN6QyxRQUFNLFFBQVEsV0FBVyxpQkFBaUI7QUFDMUMsUUFBTSxVQUFVLFdBQVcsU0FBUztBQUN4QyxDQUFDO0FBRUQsTUFBTSxTQUFTLE9BQU8saUJBQWlCLEdBQUcsQ0FBQyxFQUFFLE9BQU8sT0FBTyxNQUFNO0FBQzdELFFBQU0sTUFBTSxXQUFXLFNBQVM7QUFDaEMsUUFBTSxPQUFPLFdBQVcsdUJBQXVCO0FBQy9DLFFBQU0sT0FBTyxXQUFXLHFCQUFxQjtBQUM3QyxRQUFNLE9BQU8sV0FBVyxzQkFBc0I7QUFDOUMsUUFBTSxPQUFPLFdBQVcsb0JBQW9CO0FBQzVDLFFBQU0sT0FBTyxXQUFXLFVBQVU7QUFDdEMsQ0FBQztBQUVELE1BQU0sU0FBUyxPQUFPLG1CQUFtQixHQUFHLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDdEQsUUFBTSxLQUFLLFdBQVcsZUFBZTtBQUNyQyxRQUFNLEtBQUssV0FBVyxjQUFjO0FBQ3hDLENBQUM7QUFFRCxNQUFNLFNBQVMsT0FBTyxrQkFBa0IsR0FBRyxDQUFDLEVBQUUsUUFBUSxhQUFhLE1BQU07QUFDckUsUUFBTSxPQUFPLFdBQVcsZUFBZTtBQUN2QyxRQUFNLGFBQWEsV0FBVyxTQUFTO0FBQzNDLENBQUM7QUFFRCxNQUFNLFNBQVMsT0FBTyx5QkFBeUIsR0FBRyxDQUFDLEVBQUUsY0FBYyxNQUFNO0FBQ3JFLFFBQU0sY0FBYyxXQUFXLFNBQVM7QUFDNUMsQ0FBQztBQUVELE1BQU0sU0FBUyxPQUFPLGNBQWMsR0FBRyxDQUFDLEVBQUUsSUFBQUMsS0FBSSxPQUFPLE1BQU0sTUFBTTtBQUM3RCxRQUFNQSxJQUFHLFdBQVcsV0FBVztBQUMvQixRQUFNQSxJQUFHLFdBQVcsU0FBUztBQUM3QixRQUFNLE1BQU0sV0FBVyxTQUFTO0FBQ2hDLFFBQU0sTUFBTSxXQUFXLFdBQVc7QUFDbEMsUUFBTSxNQUFNLFdBQVcsYUFBYTtBQUNwQyxRQUFNLE1BQU0sV0FBVyxVQUFVO0FBQ2pDLFFBQU0sTUFBTSxXQUFXLFNBQVM7QUFDaEMsUUFBTSxNQUFNLFdBQVcsU0FBUztBQUNoQyxRQUFNLE1BQU0sV0FBVyxXQUFXO0FBQ2xDLFFBQU0sTUFBTSxXQUFXLE9BQU87QUFDOUIsUUFBTSxNQUFNLFdBQVcsU0FBUztBQUNoQyxRQUFNLE1BQU0sV0FBVyxTQUFTO0FBQ3BDLENBQUM7OztBQ25GRCxTQUFTLDJCQUEyQjtBQUNwQyxTQUFTLE1BQU0sbUJBQW1CO0FBQ2xDLE9BQU8sUUFBUTtBQUNmLE9BQU8sYUFBYTtBQXdDYixTQUFTLE1BQU1DLE1BQWtCO0FBQ3BDLFNBQU8sSUFBSyxNQUFNLGdCQUFnQkEsS0FBSTtBQUFBLElBQ2xDLE9BQU87QUFBRSxjQUFRLGNBQWMsRUFBRSxXQUFXLFVBQVUsR0FBRyxJQUFXO0FBQUEsSUFBRTtBQUFBLElBRXRFLEtBQUssTUFBNEI7QUFDN0IsYUFBTyxJQUFJLFFBQVEsQ0FBQyxLQUFLLFFBQVE7QUFDN0IsWUFBSTtBQUNBLGdCQUFNLEtBQUssU0FBUztBQUFBLDBCQUNkLEtBQUssU0FBUyxHQUFHLElBQUksT0FBTyxVQUFVLElBQUksR0FBRztBQUFBLHVCQUNoRDtBQUNILGFBQUcsRUFBRSxFQUFFLEtBQUssR0FBRyxFQUFFLE1BQU0sR0FBRztBQUFBLFFBQzlCLFNBQVMsT0FBTztBQUNaLGNBQUksS0FBSztBQUFBLFFBQ2I7QUFBQSxNQUNKLENBQUM7QUFBQSxJQUNMO0FBQUEsSUFFQTtBQUFBLElBRUEsY0FBYyxLQUFhLE1BQWtDO0FBQ3pELFVBQUksT0FBTyxLQUFLLG1CQUFtQixZQUFZO0FBQzNDLGFBQUssZUFBZSxLQUFLLENBQUMsYUFBYTtBQUNuQyxhQUFHO0FBQUEsWUFBVztBQUFBLFlBQU0sT0FBTyxRQUFRO0FBQUEsWUFBRyxDQUFDLEdBQUcsUUFDdEMsR0FBRyxrQkFBa0IsR0FBRztBQUFBLFVBQzVCO0FBQUEsUUFDSixDQUFDO0FBQUEsTUFDTCxPQUFPO0FBQ0gsY0FBTSxjQUFjLEtBQUssSUFBSTtBQUFBLE1BQ2pDO0FBQUEsSUFDSjtBQUFBLElBRUEsVUFBVSxPQUFlLFFBQVEsT0FBTztBQUNwQyxZQUFNLFVBQVUsT0FBTyxLQUFLO0FBQUEsSUFDaEM7QUFBQSxJQUVBLEtBQUssTUFBcUI7QUFDdEIsWUFBTSxLQUFLO0FBQ1gsV0FBSyxRQUFRLENBQUM7QUFBQSxJQUNsQjtBQUFBLElBRUEsTUFBTSxFQUFFLGdCQUFnQixLQUFLLE1BQU0sTUFBTSxRQUFRLE9BQU8sR0FBRyxJQUFJLElBQVksQ0FBQyxHQUFHO0FBQzNFLFlBQU0sTUFBTTtBQUVaLGlCQUFXLE1BQU07QUFDYixjQUFNLG1CQUFtQixJQUFJLFlBQVksbUJBQW1CO0FBQzVELGFBQUssQ0FBQztBQUFBLE1BQ1Y7QUFFQSxhQUFPLE9BQU8sTUFBTSxHQUFHO0FBQ3ZCLDBCQUFvQixJQUFJLFlBQVk7QUFFcEMsV0FBSyxpQkFBaUI7QUFDdEIsVUFBSSxRQUFRLFlBQVksTUFBTTtBQUMxQixlQUFPLEdBQUcsV0FBVztBQUFBLE1BQ3pCLENBQUM7QUFFRCxVQUFJO0FBQ0EsWUFBSSxlQUFlO0FBQUEsTUFDdkIsU0FBUyxPQUFPO0FBQ1osZUFBTyxPQUFPLFNBQU8sR0FBRyxhQUFhLElBQUksY0FBYyxHQUFHLEdBQUksR0FBRyxXQUFXO0FBQUEsTUFDaEY7QUFFQSxVQUFJO0FBQ0EsYUFBSyxVQUFVLEtBQUssS0FBSztBQUU3QixVQUFJO0FBQ0EsWUFBSSxVQUFVLEtBQUs7QUFFdkIsZUFBUztBQUNULFVBQUk7QUFDQSxZQUFJLEtBQUs7QUFFYixVQUFJLFNBQVMsQ0FBQyxDQUFDO0FBQUEsSUFDbkI7QUFBQSxFQUNKO0FBQ0o7OztBRmxIQUMsS0FBSSxLQUFLO0FBSVQsS0FBSyxTQUFTLFlBQVk7QUFJMUIsTUFBTSxPQUFPLG9CQUFvQixFQUM1QixLQUFLLENBQUMsRUFBRSxTQUFTLElBQUksTUFBTSxJQUFJLEtBQUssQ0FBQyxFQUNyQyxNQUFNLE1BQU0sTUFBTTtBQUV2QixJQUFPLGNBQVEsTUFBTUMsT0FBTSxXQUFXOzs7QUdqQnRDLE9BQU9DLFlBQVc7QUFDbEIsT0FBT0MsVUFBUztBQUdoQixTQUFTLE9BQU8sVUFBaUI7QUFDN0IsU0FBTyxTQUFTLEtBQUssUUFBUSxFQUFFLElBQUksUUFBTSxjQUFjQyxLQUFJLFNBQ3JELEtBQ0EsSUFBSUEsS0FBSSxNQUFNLEVBQUUsU0FBUyxNQUFNLE9BQU8sT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQzdEO0FBR0EsT0FBTyxlQUFlQyxPQUFNLElBQUksV0FBVyxZQUFZO0FBQUEsRUFDbkQsTUFBTTtBQUFFLFdBQU8sS0FBSyxhQUFhO0FBQUEsRUFBRTtBQUFBLEVBQ25DLElBQUksR0FBRztBQUFFLFNBQUssYUFBYSxDQUFDO0FBQUEsRUFBRTtBQUNsQyxDQUFDO0FBR00sSUFBTSxNQUFNLFNBQWdEQSxPQUFNLEtBQUs7QUFBQSxFQUMxRSxZQUFZLE1BQU07QUFBRSxXQUFPLEtBQUssYUFBYTtBQUFBLEVBQUU7QUFBQSxFQUMvQyxZQUFZLE1BQU0sVUFBVTtBQUFFLFdBQU8sS0FBSyxhQUFhLE9BQU8sUUFBUSxDQUFDO0FBQUEsRUFBRTtBQUM3RSxDQUFDO0FBUU0sSUFBTSxTQUFTLFNBQWlFRCxLQUFJLE1BQU07QUFJMUYsSUFBTSxZQUFZLFNBQXdEQSxLQUFJLFdBQVc7QUFBQSxFQUM1RixZQUFZLEtBQUs7QUFDYixXQUFPLENBQUMsSUFBSSxhQUFhLElBQUksY0FBYyxJQUFJLFNBQVM7QUFBQSxFQUM1RDtBQUFBLEVBQ0EsWUFBWSxLQUFLLFVBQVU7QUFDdkIsVUFBTSxLQUFLLE9BQU8sUUFBUTtBQUMxQixRQUFJLGNBQWMsR0FBRyxDQUFDLEtBQUssSUFBSUEsS0FBSTtBQUNuQyxRQUFJLGVBQWUsR0FBRyxDQUFDLEtBQUssSUFBSUEsS0FBSTtBQUNwQyxRQUFJLFlBQVksR0FBRyxDQUFDLEtBQUssSUFBSUEsS0FBSTtBQUFBLEVBQ3JDO0FBQ0osQ0FBQztBQVlNLElBQU0sUUFBUSxTQUE4REEsS0FBSSxPQUFPO0FBQUEsRUFDMUYsY0FBYztBQUFFLFdBQU8sQ0FBQztBQUFBLEVBQUU7QUFDOUIsQ0FBQztBQUlNLElBQU0sUUFBUSxTQUFnREEsS0FBSSxPQUFPO0FBQUEsRUFDNUUsY0FBYztBQUFFLFdBQU8sQ0FBQztBQUFBLEVBQUU7QUFDOUIsQ0FBQztBQUlNLElBQU0sUUFBUSxTQUFnREEsS0FBSSxPQUFPO0FBQUEsRUFDNUUsY0FBYztBQUFFLFdBQU8sQ0FBQztBQUFBLEVBQUU7QUFBQSxFQUMxQixZQUFZLE1BQU0sVUFBVTtBQUFFLFNBQUssUUFBUSxPQUFPLFFBQVE7QUFBQSxFQUFFO0FBQ2hFLENBQUM7QUFJTSxJQUFNLFdBQVcsU0FBc0RBLEtBQUksVUFBVTtBQUFBLEVBQ3hGLGNBQWM7QUFBRSxXQUFPLENBQUM7QUFBQSxFQUFFO0FBQzlCLENBQUM7QUFNTSxJQUFNLFVBQVUsU0FBb0RBLEtBQUksU0FBUztBQUFBLEVBQ3BGLFlBQVksTUFBTTtBQUNkLFVBQU0sV0FBOEIsQ0FBQztBQUNyQyxRQUFJLEtBQUssS0FBSyxnQkFBZ0I7QUFDOUIsV0FBTyxPQUFPLE1BQU07QUFDaEIsZUFBUyxLQUFLLEVBQUU7QUFDaEIsV0FBSyxHQUFHLGlCQUFpQjtBQUFBLElBQzdCO0FBRUEsV0FBTyxTQUFTLE9BQU8sQ0FBQUUsUUFBTUEsUUFBTyxLQUFLLEtBQUs7QUFBQSxFQUNsRDtBQUFBLEVBQ0EsWUFBWSxNQUFNLFVBQVU7QUFDeEIsZUFBVyxTQUFTLE9BQU8sUUFBUSxHQUFHO0FBQ2xDLFlBQU0sUUFBUSxRQUFRLFFBQ2YsTUFBTSxJQUFJLEVBQWEsTUFBTSxLQUFLLElBQ25DLENBQUM7QUFFUCxVQUFJLE1BQU0sU0FBUyxTQUFTLEdBQUc7QUFDM0IsYUFBSyxZQUFZLEtBQUs7QUFBQSxNQUMxQixPQUFPO0FBQ0gsYUFBSyxVQUFVLEtBQUs7QUFBQSxNQUN4QjtBQUVBLFdBQUssb0JBQW9CLE9BQU8sTUFBTSxTQUFTLFNBQVMsQ0FBQztBQUN6RCxXQUFLLGlCQUFpQixPQUFPLE1BQU0sU0FBUyxNQUFNLENBQUM7QUFBQSxJQUN2RDtBQUFBLEVBQ0o7QUFDSixDQUFDO0FBSU0sSUFBTSxXQUFXLFNBQXNERixLQUFJLFFBQVE7QUFRbkYsSUFBTSxTQUFTLFNBQXFFQyxPQUFNLFFBQVE7QUFBQSxFQUNyRyxjQUFjO0FBQUUsV0FBTyxDQUFDO0FBQUEsRUFBRTtBQUM5QixDQUFDO0FBSU0sSUFBTSxRQUFRLFNBQWdERCxLQUFJLE9BQU87QUFBQSxFQUM1RSxZQUFZLE1BQU0sVUFBVTtBQUN4QixlQUFXLFNBQVMsT0FBTyxRQUFRLEdBQUc7QUFDbEMsVUFBSSxNQUFNLFFBQVEsTUFBTSxNQUFNLFFBQVEsTUFBTTtBQUN4QyxhQUFLLFVBQVUsT0FBTyxNQUFNLElBQUk7QUFBQSxNQUNwQyxPQUFPO0FBQ0gsYUFBSyxVQUFVLEtBQUs7QUFBQSxNQUN4QjtBQUFBLElBQ0o7QUFBQSxFQUNKO0FBQ0osQ0FBQztBQUlNLElBQU0sU0FBUyxTQUFrREEsS0FBSSxRQUFRO0FBQUEsRUFDaEYsY0FBYztBQUFFLFdBQU8sQ0FBQztBQUFBLEVBQUU7QUFDOUIsQ0FBQztBQUlNLElBQU0sU0FBUyxTQUFzREMsT0FBTSxNQUFNO0FBSWpGLElBQU0sYUFBYSxTQUEwREQsS0FBSSxZQUFZO0FBQUEsRUFDaEcsWUFBWSxNQUFNO0FBQUUsV0FBTyxDQUFDLEtBQUssU0FBUyxLQUFLLEtBQUs7QUFBQSxFQUFFO0FBQUEsRUFDdEQsWUFBWSxNQUFNLFVBQVU7QUFDeEIsZUFBVyxTQUFTLE9BQU8sUUFBUSxHQUFHO0FBQ2xDLFVBQUksaUJBQWlCQSxLQUFJLFNBQVM7QUFDOUIsYUFBSyxZQUFZLEtBQUs7QUFBQSxNQUMxQixPQUFPO0FBQ0gsYUFBSyxVQUFVLEtBQUs7QUFBQSxNQUN4QjtBQUFBLElBQ0o7QUFBQSxFQUNKO0FBQ0osQ0FBQztBQUlNLElBQU0sVUFBVSxTQUFvREEsS0FBSSxPQUFPOzs7QUNyS3RGOzs7QUNDQSxTQUFvQixXQUFYRyxnQkFBMEI7OztBQ0RuQyxPQUFPQyxZQUFXO0FBQ2xCLE9BQU8sU0FBUzs7O0FDRGhCLE9BQU9DLGNBQWE7QUFFcEIsU0FBb0IsV0FBWEMsZ0JBQXVCO0FBR2hDLElBQU0sT0FBTyxPQUFPLE1BQU07QUFDMUIsSUFBTSxPQUFPLE9BQU8sTUFBTTtBQUUxQixJQUFNLEVBQUUsV0FBVyxXQUFXLElBQUlDOzs7QUNObEMsT0FBTyxjQUFjO0FBQ3JCLE9BQU8sUUFBUTs7O0FDVVIsU0FBU0MsS0FDWixNQUNBLE9BQ0Y7QUFDRSxTQUFPLElBQUssT0FBTyxNQUFhLEtBQUs7QUFDekM7QUFFQSxJQUFNLFFBQVE7QUFBQSxFQUNWLEtBQVk7QUFBQSxFQUNaLFFBQWU7QUFBQSxFQUNmLFdBQWtCO0FBQUE7QUFBQTtBQUFBLEVBR2xCLE9BQWM7QUFBQSxFQUNkLE9BQWM7QUFBQSxFQUNkLE9BQWM7QUFBQSxFQUNkLFVBQWlCO0FBQUEsRUFDakIsU0FBZ0I7QUFBQSxFQUNoQixVQUFpQjtBQUFBLEVBQ2pCLFFBQWU7QUFBQSxFQUNmLE9BQWM7QUFBQSxFQUNkLFFBQWU7QUFBQSxFQUNmLFFBQWU7QUFBQSxFQUNmLFlBQW1CO0FBQUEsRUFDbkIsU0FBZ0I7QUFDcEI7QUE2Qk8sSUFBTSxPQUFPQTs7O0FEOURwQixJQUFNLFdBQVcsU0FBUyxZQUFZO0FBQ3RDLElBQU0sUUFBUSxHQUFHLFlBQVk7QUFHN0IsSUFBTSxPQUFPLFNBQVMsRUFBRSxFQUFFLEtBQUssS0FBSyxLQUFNLE1BQU07QUFDNUMsUUFBTSxNQUFNLG9CQUFJLEtBQUs7QUFDckIsUUFBTSxPQUFPLENBQUMsT0FBTyxPQUFPLE9BQU8sT0FBTyxPQUFPLE9BQU8sS0FBSztBQUM3RCxRQUFNLFNBQVMsQ0FBQyxPQUFPLE9BQU8sT0FBTyxPQUFPLE9BQU8sT0FBTyxPQUFPLE9BQU8sT0FBTyxPQUFPLE9BQU8sS0FBSztBQUVsRyxRQUFNLE1BQU0sS0FBSyxJQUFJLE9BQU8sQ0FBQztBQUM3QixRQUFNLFFBQVEsT0FBTyxJQUFJLFNBQVMsQ0FBQztBQUNuQyxRQUFNLE9BQU8sSUFBSSxRQUFRO0FBQ3pCLFFBQU0sUUFBUSxJQUFJLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxHQUFHLEdBQUc7QUFDdkQsUUFBTSxVQUFVLElBQUksV0FBVyxFQUFFLFNBQVMsRUFBRSxTQUFTLEdBQUcsR0FBRztBQUUzRCxTQUFPLEdBQUcsR0FBRyxJQUFJLEtBQUssSUFBSSxJQUFJLElBQUksS0FBSyxJQUFJLE9BQU87QUFDdEQsQ0FBQztBQUdELElBQU0sa0JBQWtCLFNBQVMsU0FBUyxzQkFBc0IsR0FBRyxPQUFPLEtBQUssQ0FBQztBQUdoRixTQUFTLHdCQUF3QjtBQUM3QixRQUFNLFlBQVksU0FBUyxzQkFBc0I7QUFDakQsTUFBSSxXQUFXO0FBQ1gsb0JBQWdCLElBQUksVUFBVSxPQUFPLENBQUM7QUFBQSxFQUMxQztBQUNKO0FBR0EsSUFBTSx3QkFBd0IsU0FBbUIsQ0FBQyxDQUFDO0FBRW5ELFNBQVMsbUJBQW1CO0FBQ3hCLFFBQU0sYUFBYSxTQUFTLGVBQWU7QUFDM0MsUUFBTSxXQUFXLFNBQVMsc0JBQXNCLEdBQUcsT0FBTyxLQUFLO0FBRy9ELFFBQU0scUJBQXFCLFdBQ3RCLE9BQU8sQ0FBQyxPQUFZLEdBQUcsWUFBWSxFQUFFLFNBQVMsQ0FBQyxFQUMvQyxJQUFJLENBQUMsT0FBWSxHQUFHLE9BQU8sQ0FBQztBQUdqQyxRQUFNLGdCQUFnQixDQUFDLEdBQUcsb0JBQUksSUFBSSxDQUFDLEdBQUcsb0JBQW9CLFFBQVEsQ0FBQyxDQUFDO0FBRXBFLHdCQUFzQixJQUFJLGNBQWMsS0FBSyxDQUFDLEdBQVcsTUFBYyxJQUFJLENBQUMsQ0FBQztBQUNqRjtBQUdBLElBQU0sZUFBZSxTQUFTLEVBQUU7QUFFaEMsU0FBUyxxQkFBcUI7QUFDMUIsUUFBTSxTQUFTLFNBQVMsbUJBQW1CO0FBQzNDLE1BQUksVUFBVSxPQUFPLFVBQVUsR0FBRztBQUM5QixpQkFBYSxJQUFJLE9BQU8sVUFBVSxDQUFDO0FBQUEsRUFDdkMsT0FBTztBQUNILFVBQU0sWUFBWSxTQUFTLHNCQUFzQjtBQUNqRCxpQkFBYSxJQUFJLGFBQWEsV0FBVyxPQUFPLEtBQUssQ0FBQyxFQUFFO0FBQUEsRUFDNUQ7QUFDSjtBQUVBLHNCQUFzQjtBQUN0QixtQkFBbUI7QUFDbkIsaUJBQWlCO0FBR2pCLFNBQVMsUUFBUSxTQUFTLENBQUMsR0FBUSxPQUFlLFNBQWlCO0FBQy9ELE1BQUksVUFBVSxhQUFhO0FBRXZCLFVBQU0sY0FBYyxTQUFTLElBQUk7QUFDakMsUUFBSSxDQUFDLE1BQU0sV0FBVyxHQUFHO0FBQ3JCLHNCQUFnQixJQUFJLFdBQVc7QUFBQSxJQUNuQztBQUVBLGdCQUFZLE1BQU07QUFDZCx1QkFBaUI7QUFDakIseUJBQW1CO0FBQUEsSUFDdkIsQ0FBQztBQUFBLEVBQ0wsV0FBVyxVQUFVLGdCQUFnQixVQUFVLGdCQUFnQjtBQUUzRCxnQkFBWSxNQUFNO0FBQ2QsNEJBQXNCO0FBQ3RCLHlCQUFtQjtBQUNuQix1QkFBaUI7QUFBQSxJQUNyQixDQUFDO0FBQUEsRUFDTDtBQUNKLENBQUM7QUFHRCxTQUFTLFlBQVksVUFBc0IsYUFBcUIsR0FBRyxRQUFnQixHQUFHO0FBQ2xGLE1BQUksVUFBVTtBQUVkLFdBQVMsVUFBVTtBQUNmLFFBQUk7QUFDQSxZQUFNLGVBQWUsZ0JBQWdCLElBQUk7QUFDekMsZUFBUztBQUdULFVBQUksVUFBVSxZQUFZO0FBQ3RCLG1CQUFXLE1BQU07QUFDYixnQkFBTSxjQUFjLGdCQUFnQixJQUFJO0FBQ3hDLGNBQUksaUJBQWlCLGVBQWUsVUFBVSxhQUFhLEdBQUc7QUFDMUQ7QUFDQSx1QkFBVyxTQUFTLFFBQVEsS0FBSyxJQUFJLEdBQUcsT0FBTyxDQUFDO0FBQUEsVUFDcEQ7QUFBQSxRQUNKLEdBQUcsS0FBSztBQUFBLE1BQ1o7QUFBQSxJQUNKLFNBQVMsT0FBTztBQUNaLFVBQUksVUFBVSxZQUFZO0FBQ3RCO0FBQ0EsbUJBQVcsU0FBUyxRQUFRLEtBQUssSUFBSSxHQUFHLE9BQU8sQ0FBQztBQUFBLE1BQ3BEO0FBQUEsSUFDSjtBQUFBLEVBQ0o7QUFFQSxVQUFRO0FBQ1o7QUFHQSxJQUFNLFdBQVcsU0FBUyxJQUFJLEVBQUUsS0FBSyxLQUFNLE1BQU07QUFDN0MsTUFBSTtBQUNBLFVBQU0sU0FBUyxLQUFLLDZEQUE2RDtBQUNqRixXQUFPLEdBQUcsS0FBSyxNQUFNLFdBQVcsTUFBTSxDQUFDLENBQUM7QUFBQSxFQUM1QyxRQUFRO0FBQ0osV0FBTztBQUFBLEVBQ1g7QUFDSixDQUFDO0FBRUQsSUFBTSxjQUFjLFNBQVMsSUFBSSxFQUFFLEtBQUssS0FBTSxNQUFNO0FBQ2hELE1BQUk7QUFDQSxVQUFNLFNBQVMsS0FBSyx3REFBMEQ7QUFDOUUsV0FBTyxHQUFHLE1BQU07QUFBQSxFQUNwQixRQUFRO0FBQ0osV0FBTztBQUFBLEVBQ1g7QUFDSixDQUFDO0FBRUQsSUFBTSxjQUFjLFNBQVMsRUFBQyxNQUFNLElBQUksUUFBUSxLQUFJLENBQUMsRUFBRSxLQUFLLEtBQUssTUFBTTtBQUNuRSxNQUFJO0FBQ0EsUUFBSSxTQUFTLFdBQVcsTUFBTSxnQkFBZ0IsTUFBTTtBQUNwRCxhQUFTLEtBQUssTUFBTSxTQUFTLEdBQUc7QUFFaEMsUUFBSSxPQUFPO0FBQ1gsUUFBSSxXQUFXLEdBQUc7QUFDZCxhQUFPO0FBQUEsSUFDWCxXQUFXLFVBQVUsSUFBSTtBQUNyQixhQUFPO0FBQUEsSUFDWCxXQUFXLFVBQVUsSUFBSTtBQUNyQixhQUFPO0FBQUEsSUFDWCxPQUFPO0FBQ0gsYUFBTztBQUFBLElBQ1g7QUFFQSxXQUFPLEVBQUMsTUFBWSxRQUFRLEdBQUcsTUFBTSxJQUFHO0FBQUEsRUFDNUMsUUFBUTtBQUNKLFdBQU8sRUFBQyxNQUFNLElBQUksUUFBUSxPQUFNO0FBQUEsRUFDcEM7QUFDSixDQUFDO0FBRWMsU0FBUixJQUFxQixZQUF5QjtBQUNqRCxRQUFNLEVBQUUsS0FBSyxNQUFNLE1BQU0sSUFBSUMsT0FBTTtBQUVuQyxTQUFPLGdCQUFBQztBQUFBLElBQUM7QUFBQTtBQUFBLE1BQ0osV0FBVTtBQUFBLE1BQ1Y7QUFBQSxNQUNBLGFBQWFELE9BQU0sWUFBWTtBQUFBLE1BQy9CLFFBQVEsTUFBTSxPQUFPO0FBQUEsTUFDckIsYUFBYTtBQUFBLE1BQ2IsT0FDSSxnQkFBQUM7QUFBQSxRQUFDO0FBQUE7QUFBQSxVQUNHLGFBQ0kscUJBQUMsU0FBSSxRQUFRQyxLQUFJLE1BQU0sT0FBTyxTQUFTLElBQUksV0FBVSxRQUNqRDtBQUFBLDRCQUFBRDtBQUFBLGNBQUM7QUFBQTtBQUFBLGdCQUNHLFdBQVU7QUFBQSxnQkFDVixTQUFTO0FBQUEsZ0JBQ1QsVUFBVSxLQUFLLHFCQUFxQixFQUFFO0FBQUEsa0JBQUcsZ0JBQ3JDLFdBQVcsSUFBSSxRQUNYLGdCQUFBQTtBQUFBLG9CQUFDO0FBQUE7QUFBQSxzQkFDRyxXQUFXLEtBQUssZUFBZSxFQUFFLEdBQUcsWUFBVSxXQUFXLEtBQUsscUJBQXFCLFdBQVc7QUFBQSxzQkFDOUYsV0FBVyxNQUFNLFNBQVMsU0FBUyxhQUFhLEdBQUcsU0FBUyxDQUFDO0FBQUEsc0JBQzdELE9BQU8sZ0JBQUFBLEtBQUMsV0FBTSxPQUFPLEdBQUcsU0FBUyxHQUFHO0FBQUE7QUFBQSxrQkFDeEMsQ0FDSDtBQUFBLGdCQUNMO0FBQUE7QUFBQSxZQUNKO0FBQUEsWUFDQSxnQkFBQUE7QUFBQSxjQUFDO0FBQUE7QUFBQSxnQkFDRyxXQUFVO0FBQUEsZ0JBQ1YsT0FBTyxLQUFLLFlBQVk7QUFBQTtBQUFBLFlBQzVCO0FBQUEsYUFDSjtBQUFBLFVBRUosY0FDSSxnQkFBQUE7QUFBQSxZQUFDO0FBQUE7QUFBQSxjQUNHLFFBQVFDLEtBQUksTUFBTTtBQUFBLGNBQ2xCLFdBQVU7QUFBQSxjQUNWLE9BQU8sS0FBSyxJQUFJO0FBQUE7QUFBQSxVQUNwQjtBQUFBLFVBRUosV0FDSSxxQkFBQyxTQUFJLFFBQVFBLEtBQUksTUFBTSxLQUFLLFNBQVMsR0FBRyxXQUFVLHFCQUM5QztBQUFBLGlDQUFDLFNBQUksV0FBVSxPQUNYO0FBQUEsOEJBQUFELEtBQUMsV0FBTSxPQUFNLFFBQU87QUFBQSxjQUNwQixnQkFBQUEsS0FBQyxXQUFNLE9BQU8sS0FBSyxRQUFRLEdBQUc7QUFBQSxlQUNsQztBQUFBLFlBQ0EscUJBQUMsU0FBSSxXQUFVLFVBQ1g7QUFBQSw4QkFBQUEsS0FBQyxXQUFNLE9BQU0sUUFBTztBQUFBLGNBQ3BCLGdCQUFBQSxLQUFDLFdBQU0sT0FBTyxLQUFLLFdBQVcsR0FBRztBQUFBLGVBQ3JDO0FBQUEsWUFDQSxnQkFBQUE7QUFBQSxjQUFDO0FBQUE7QUFBQSxnQkFDRyxXQUFVO0FBQUEsZ0JBQ1YsV0FBVyxNQUFNLFVBQVUsYUFBYTtBQUFBLGdCQUN4QyxPQUNJLHFCQUFDLFNBQ0c7QUFBQSxrQ0FBQUEsS0FBQyxXQUFNLE9BQU8sS0FBSyxXQUFXLEVBQUUsR0FBRyxDQUFBRSxXQUFTQSxPQUFNLElBQUksR0FBRztBQUFBLGtCQUN6RCxnQkFBQUYsS0FBQyxXQUFNLE9BQU8sS0FBSyxXQUFXLEVBQUUsR0FBRyxDQUFBRSxXQUFTLElBQUlBLE9BQU0sTUFBTSxFQUFFLEdBQUc7QUFBQSxtQkFDckU7QUFBQTtBQUFBLFlBRVI7QUFBQSxhQUNKO0FBQUE7QUFBQSxNQUVSO0FBQUE7QUFBQSxFQUVSO0FBQ0o7OztBRTFOQSxJQUFNLHVCQUFOLE1BQTJCO0FBQUEsRUFDZixTQUFtQyxvQkFBSSxJQUFJO0FBQUEsRUFDM0MsZUFBdUI7QUFBQSxFQUN2QixXQUFvQjtBQUFBLEVBQ3BCLG9CQUFvQyxDQUFDO0FBQUEsRUFFN0MsY0FBYztBQUNWLFNBQUssV0FBVztBQUFBLEVBQ3BCO0FBQUEsRUFFQSxNQUFjLGFBQWE7QUFDdkIsUUFBSTtBQUVBLFlBQU0sVUFBVSxNQUFNLFVBQVUsb0JBQW9CO0FBQ3BELFlBQU0sZUFBZSxHQUFHLFFBQVEsS0FBSyxDQUFDO0FBR3RDLFVBQUk7QUFDQSxjQUFNLFVBQVUsWUFBWSxZQUFZLEdBQUc7QUFBQSxNQUMvQyxRQUFRO0FBQ0osZ0JBQVEsSUFBSSx1QkFBdUIsWUFBWSxpQkFBaUI7QUFDaEU7QUFBQSxNQUNKO0FBR0EsWUFBTSxTQUFTLE1BQU0sVUFBVSxTQUFTLFlBQVksMklBQTJJO0FBQy9MLFlBQU0sYUFBYSxPQUFPLEtBQUssRUFBRSxNQUFNLElBQUksRUFBRSxPQUFPLFVBQVEsS0FBSyxTQUFTLENBQUM7QUFHM0UsV0FBSyxPQUFPLE1BQU07QUFDbEIsaUJBQVcsWUFBWSxZQUFZO0FBQy9CLGFBQUssT0FBTyxJQUFJLFVBQVU7QUFBQSxVQUN0QixNQUFNO0FBQUEsVUFDTixhQUFhO0FBQUEsVUFDYixhQUFhO0FBQUEsUUFDakIsQ0FBQztBQUFBLE1BQ0w7QUFFQSxjQUFRLElBQUksVUFBVSxLQUFLLE9BQU8sSUFBSSxtQkFBbUI7QUFDekQsV0FBSyxXQUFXO0FBR2hCLFdBQUssa0JBQWtCLFFBQVEsY0FBWSxTQUFTLENBQUM7QUFDckQsV0FBSyxvQkFBb0IsQ0FBQztBQUFBLElBRTlCLFNBQVMsT0FBTztBQUNaLGNBQVEsTUFBTSxtQ0FBbUMsS0FBSztBQUFBLElBQzFEO0FBQUEsRUFDSjtBQUFBLEVBRU8sU0FBUyxVQUFzQjtBQUNsQyxRQUFJLEtBQUssVUFBVTtBQUNmLGVBQVM7QUFBQSxJQUNiLE9BQU87QUFDSCxXQUFLLGtCQUFrQixLQUFLLFFBQVE7QUFBQSxJQUN4QztBQUFBLEVBQ0o7QUFBQSxFQUVRLGdCQUFnQixPQUE0QjtBQUVoRCxVQUFNLGFBQWEsS0FBSyxNQUFNLGNBQWM7QUFHNUMsVUFBTSxzQkFBc0IsS0FBSyxlQUFlLE1BQU07QUFDdEQsVUFBTSxhQUFhLEtBQUssSUFBSSxzQkFBc0IsQ0FBQyxJQUFJO0FBRXZELFdBQU8sYUFBYTtBQUFBLEVBQ3hCO0FBQUE7QUFBQSxFQUdPLGFBQTRCO0FBQy9CLFFBQUksS0FBSyxPQUFPLFNBQVMsRUFBRyxRQUFPO0FBRW5DLFFBQUksU0FBUztBQUNiLFFBQUksZ0JBQW9DO0FBRXhDLGVBQVcsQ0FBQyxNQUFNLEtBQUssS0FBSyxLQUFLLFFBQVE7QUFDckMsWUFBTSxTQUFTLEtBQUssZ0JBQWdCLEtBQUs7QUFDekMsWUFBTSxNQUFNLEtBQUssSUFBSSxLQUFLLE9BQU8sR0FBRyxJQUFJLE1BQU07QUFFOUMsVUFBSSxNQUFNLFFBQVE7QUFDZCxpQkFBUztBQUNULHdCQUFnQjtBQUFBLE1BQ3BCO0FBQUEsSUFDSjtBQUVBLFFBQUksZUFBZTtBQUVmLG9CQUFjO0FBQ2Qsb0JBQWMsY0FBYyxLQUFLO0FBQ2pDLFdBQUs7QUFFTCxjQUFRLElBQUksdUJBQXVCLGNBQWMsSUFBSSxhQUFhLGNBQWMsV0FBVyxTQUFTO0FBQ3BHLGFBQU8sY0FBYztBQUFBLElBQ3pCO0FBRUEsV0FBTztBQUFBLEVBQ1g7QUFBQSxFQUVBLE1BQWEsZ0JBQWdCO0FBQ3pCLFVBQU0sS0FBSyxXQUFXO0FBQUEsRUFDMUI7QUFDSjtBQUdBLElBQU0sZUFBZSxJQUFJLHFCQUFxQjtBQUc5QyxJQUFNLG1CQUFtQixTQUFpQixFQUFFO0FBRzVDLGFBQWEsU0FBUyxNQUFNO0FBQ3hCLFFBQU0sZUFBZSxhQUFhLFdBQVc7QUFDN0MsTUFBSSxjQUFjO0FBQ2QscUJBQWlCLElBQUksWUFBWTtBQUNqQyxZQUFRLElBQUksMEJBQTBCLFlBQVksRUFBRTtBQUFBLEVBQ3hEO0FBQ0osQ0FBQztBQUdELGlCQUFpQixLQUFLLEtBQUssS0FBTSxZQUFZO0FBQ3pDLFFBQU0sWUFBWSxhQUFhLFdBQVc7QUFDMUMsU0FBTyxhQUFhLGlCQUFpQixJQUFJO0FBQzdDLENBQUM7QUFHRCxJQUFNLGlCQUFpQixTQUFTLEVBQUUsRUFBRSxLQUFLLEtBQVEsWUFBWTtBQUN6RCxRQUFNLGFBQWEsY0FBYztBQUNqQyxTQUFPO0FBQ1gsQ0FBQztBQUVjLFNBQVIsVUFBMkIsWUFBeUI7QUFDdkQsUUFBTSxFQUFFLEtBQUssTUFBTSxPQUFPLE9BQU8sSUFBSUMsT0FBTTtBQUUzQyxTQUFPLGdCQUFBQztBQUFBLElBQUM7QUFBQTtBQUFBLE1BQ0osV0FBVTtBQUFBLE1BQ1Y7QUFBQSxNQUNBLGFBQWFELE9BQU0sWUFBWTtBQUFBLE1BQy9CLFFBQVEsTUFBTSxPQUFPLFFBQVE7QUFBQSxNQUM3QixPQUFPQSxPQUFNLE1BQU07QUFBQSxNQUNuQixTQUFTQSxPQUFNLFFBQVE7QUFBQSxNQUN2QixPQUNJLGdCQUFBQztBQUFBLFFBQUM7QUFBQTtBQUFBLFVBQ0csV0FBVTtBQUFBLFVBQ1YsS0FBSyxLQUFLLGdCQUFnQixFQUFFLEdBQUcsVUFBUTtBQUNuQyxnQkFBSSxDQUFDLEtBQU0sUUFBTztBQUNsQixtQkFBTztBQUFBLHdEQUM2QixJQUFJO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxVQUs1QyxDQUFDO0FBQUE7QUFBQSxNQUNMO0FBQUE7QUFBQSxFQUVSO0FBQ0o7OztBQ2hLQSxZQUFJLE1BQU07QUFBQSxFQUNOLEtBQUs7QUFBQSxFQUNMLE9BQU87QUFDSCxnQkFBSSxhQUFhLEVBQUUsSUFBSSxHQUFHO0FBQzFCLGdCQUFJLGFBQWEsRUFBRSxJQUFJLFNBQVM7QUFBQSxFQUNwQztBQUNKLENBQUM7IiwKICAibmFtZXMiOiBbIkFzdGFsIiwgIkd0ayIsICJHZGsiLCAiQXN0YWwiLCAiYmluZCIsICJpbnRlcnZhbCIsICJBc3RhbCIsICJBc3RhbCIsICJ2IiwgImludGVydmFsIiwgImV4ZWMiLCAiY3RvcnMiLCAiR3RrIiwgIkFzdGFsIiwgInNuYWtlaWZ5IiwgInBhdGNoIiwgIkh5cHJsYW5kIiwgIldwIiwgIkFwcCIsICJHdGsiLCAiQXN0YWwiLCAiQXN0YWwiLCAiR3RrIiwgIkd0ayIsICJBc3RhbCIsICJjaCIsICJkZWZhdWx0IiwgIkFzdGFsIiwgIkdPYmplY3QiLCAiZGVmYXVsdCIsICJHT2JqZWN0IiwgImpzeCIsICJBc3RhbCIsICJqc3giLCAiR3RrIiwgImF1ZGlvIiwgIkFzdGFsIiwgImpzeCJdCn0K
