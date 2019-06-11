this.au = this.au || {};
this.au.jitHtmlBrowser = (function (exports, jit, jitHtml, kernel, runtimeHtmlBrowser) {
  'use strict';

  const { enter, leave } = kernel.Profiler.createTimer('BasicConfiguration');
  /**
   * A DI configuration object containing html-specific, browser-specific registrations:
   * - `BasicConfiguration` from `@aurelia/runtime-html-browser`
   * - `DefaultComponents` from `@aurelia/jit`
   * - `DefaultBindingSyntax` from `@aurelia/jit`
   * - `DefaultBindingLanguage` from `@aurelia/jit`
   * - `DefaultComponents` from `@aurelia/jit-html`
   * - `DefaultBindingLanguage` from `@aurelia/jit-html`
   */
  const BasicConfiguration = {
      /**
       * Apply this configuration to the provided container.
       */
      register(container) {
          if (kernel.Profiler.enabled) {
              enter();
          }
          runtimeHtmlBrowser.BasicConfiguration
              .register(container)
              .register(...jit.DefaultBindingLanguage, ...jit.DefaultBindingSyntax, ...jit.DefaultComponents, ...jitHtml.DefaultBindingLanguage, ...jitHtml.DefaultComponents);
          if (kernel.Profiler.enabled) {
              leave();
          }
          return container;
      },
      /**
       * Create a new container with this configuration applied to it.
       */
      createContainer() {
          if (kernel.Profiler.enabled) {
              enter();
          }
          const container = this.register(kernel.DI.createContainer());
          if (kernel.Profiler.enabled) {
              leave();
          }
          return container;
      }
  };

  exports.BasicConfiguration = BasicConfiguration;

  return exports;

}({}, jit, jitHtml, kernel, runtimeHtmlBrowser));
//# sourceMappingURL=index.iife.js.map
