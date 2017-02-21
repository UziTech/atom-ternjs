'use babel';

import ternConfigDocs from '../../config/tern-config-docs';
import pluginDefinitions from '../../config/tern-plugins-defintions.js';

import {
  ecmaVersions,
  availableLibs,
  availablePlugins
} from '../../config/tern-config';

const templateContainer = `

  <div>
    <h1 class="title"></h1>
    <div class="content"></div>
    <button class="btn btn-default">Save &amp; Restart Server</button>
  </div>
`;

export const createView = (model) => {

  return new ConfigView(model).init();
};

export default class ConfigView {

  constructor(model) {

    this.setModel(model);
    model.gatherData();
  }

  init() {

    const projectDir = this.model.getProjectDir();

    this.el = document.createElement('div');
    this.el.classList.add('atom-ternjs-config');
    this.el.innerHTML = templateContainer;

    const elContent = this.el.querySelector('.content');
    const elTitle = this.el.querySelector('.title');
    elTitle.innerHTML = projectDir;

    const buttonSave = this.el.querySelector('button');

    buttonSave.addEventListener('click', (e) => {

      this.model.updateConfig();
    });

    elContent.appendChild(this.renderRadio('ecmaVersion'));
    elContent.appendChild(this.renderlibs('libs'));
    elContent.appendChild(this.renderEditors('loadEagerly', this.model.config.loadEagerly));
    elContent.appendChild(this.renderEditors('dontLoad', this.model.config.dontLoad));
    elContent.appendChild(this.renderPlugins('plugins'));

    return this.el;
  }

  buildSection(sectionTitle) {

    const section = document.createElement('section');
    section.classList.add(sectionTitle);

    const header = document.createElement('h2');
    header.innerHTML = sectionTitle;

    section.appendChild(header);

    const docs = ternConfigDocs[sectionTitle].doc;

    if (docs) {

      const doc = document.createElement('p');
      doc.innerHTML = docs;

      section.appendChild(doc);
    }

    return section;
  }

  renderRadio(sectionTitle) {

    const section = this.buildSection(sectionTitle);

    ecmaVersions.forEach((ecmaVersion) => {

      const inputWrapper = document.createElement('div');
      inputWrapper.classList.add('input-wrapper');

      const label = document.createElement('span');
      label.innerHTML = `ecmaVersion ${ecmaVersion}`;

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'ecmaVersions';
      radio.value = ecmaVersion;
      radio.checked = this.model.config.ecmaVersion === ecmaVersion;

      radio.addEventListener('change', (e) => {

        this.model.setEcmaVersion(e.target.value);

      }, false);

      inputWrapper.appendChild(label);
      inputWrapper.appendChild(radio);
      section.appendChild(inputWrapper);
    });

    return section;
  }

  renderEditors(identifier, array) {

    const section = this.buildSection(identifier);
    const paths = array || [];

    paths.forEach((path) => {

      section.appendChild(this.createInputWrapper(path, identifier));
    });

    section.appendChild(this.createInputWrapper(null, identifier));

    return section;
  }

  renderPlugins(sectionTitle) {

    const section = this.buildSection(sectionTitle);
    const plugins = Object.keys(this.model.config.plugins);
    const availablePluginsKeys = Object.keys(availablePlugins);
    const unknownPlugins = plugins.filter((plugin) => {

      return !availablePlugins[plugin] ? true : false;
    });

    availablePluginsKeys.forEach((plugin) => {

      const wrapper = document.createElement('p');

      wrapper.appendChild(
        this.buildBoolean(
          plugin,
          'plugin',
          this.model.config.plugins[plugin]
        )
      );

      const doc = document.createElement('span');
      doc.innerHTML = pluginDefinitions[plugin] && pluginDefinitions[plugin].doc;

      wrapper.appendChild(doc);
      section.appendChild(wrapper);
    });

    return section;
  }

  renderlibs(sectionTitle) {

    const section = this.buildSection(sectionTitle);

    availableLibs.forEach((lib) => {

      section.appendChild(
        this.buildBoolean(
          lib,
          'lib',
          this.model.config.libs.includes(lib)
        )
      );
    });

    return section;
  }

  buildBoolean(key, type, checked) {

    const inputWrapper = document.createElement('div');
    const label = document.createElement('span');
    const checkbox = document.createElement('input');

    inputWrapper.classList.add('input-wrapper');
    label.innerHTML = key;
    checkbox.type = 'checkbox';
    checkbox.value = key;
    checkbox.checked = checked;

    checkbox.addEventListener('change', (e) => {

      switch (type) {

        case 'lib': {

          e.target.checked ? this.model.addLib(key) : this.model.removeLib(key);

        } break;

        case 'plugin': {

          e.target.checked ? this.model.addPlugin(key) : this.model.removePlugin(key);
        }
      }

    }, false);

    inputWrapper.appendChild(label);
    inputWrapper.appendChild(checkbox);

    return inputWrapper;
  }

  createInputWrapper(path, identifier) {

    const inputWrapper = document.createElement('div');
    const editor = this.createTextEditor(path);

    inputWrapper.classList.add('input-wrapper');
    editor.__ternjs_identifier = identifier;
    inputWrapper.appendChild(editor);
    inputWrapper.appendChild(this.createAdd(identifier));
    inputWrapper.appendChild(this.createSub(editor));

    return inputWrapper;
  }

  createSub(editor) {

    const sub = document.createElement('span');
    sub.classList.add('sub');
    sub.classList.add('inline-block');
    sub.classList.add('status-removed');
    sub.classList.add('icon');
    sub.classList.add('icon-diff-removed');

    sub.addEventListener('click', (e) => {

      this.model.removeEditor(editor);
      const inputWrapper = e.target.closest('.input-wrapper');
      inputWrapper.parentNode.removeChild(inputWrapper);

    }, false);

    return sub;
  }

  createAdd(identifier) {

    const add = document.createElement('span');
    add.classList.add('add');
    add.classList.add('inline-block');
    add.classList.add('status-added');
    add.classList.add('icon');
    add.classList.add('icon-diff-added');
    add.addEventListener('click', (e) => {

      e.target.closest('section').appendChild(this.createInputWrapper(null, identifier));

    }, false);

    return add;
  }

  createTextEditor(path) {

    const item = document.createElement('atom-text-editor');
    item.setAttribute('mini', true);

    if (path) {

      item.getModel().getBuffer().setText(path);
    }

    this.model.editors.push(item);

    return item;
  }

  getModel() {

    return this.model;
  }

  setModel(model) {

    this.model = model;
  }

  destroy() {

    this.el.remove();
  }
}