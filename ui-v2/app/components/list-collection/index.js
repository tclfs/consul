import { inject as service } from '@ember/service';
import { computed, get, set } from '@ember/object';
import Component from 'ember-collection/components/ember-collection';
import PercentageColumns from 'ember-collection/layouts/percentage-columns';
import style from 'ember-computed-style';
import Slotted from 'block-slots';
import WithResizing from 'consul-ui/mixins/with-resizing';

const formatItemStyle = PercentageColumns.prototype.formatItemStyle;
export default Component.extend(Slotted, WithResizing, {
  dom: service('dom'),
  tagName: 'div',
  attributeBindings: ['style'],
  height: 500,
  cellHeight: 70,
  style: style('getStyle'),
  classNames: ['list-collection'],
  checked: null,
  init: function() {
    this._super(...arguments);
    this.columns = [100];
  },
  didReceiveAttrs: function() {
    this._super(...arguments);
    this._cellLayout = this['cell-layout'] = new PercentageColumns(
      get(this, 'items.length'),
      get(this, 'columns'),
      get(this, 'cellHeight')
    );
    const o = this;
    this['cell-layout'].formatItemStyle = function(itemIndex) {
      let style = formatItemStyle.apply(this, arguments);
      if (o.checked === itemIndex) {
        style = `${style};z-index: 1`;
      }
      return style;
    };
  },
  getStyle: computed('height', function() {
    return {
      height: get(this, 'height'),
    };
  }),
  resize: function(e) {
    // TODO: This top part is very similar to resize in tabular-collection
    // see if it make sense to DRY out
    const dom = get(this, 'dom');
    const $appContent = dom.element('main > div');
    if ($appContent) {
      const border = 1;
      const rect = this.element.getBoundingClientRect();
      const $footer = dom.element('footer[role="contentinfo"]');
      const space = rect.top + $footer.clientHeight + border;
      const height = e.detail.height - space;
      this.set('height', Math.max(0, height));
      this.updateItems();
      this.updateScrollPosition();
    }
  },
  actions: {
    click: function(e) {
      return this.dom.clickFirstAnchor(e, '.list-collection > ul > li');
    },
    change: function(index, e = {}) {
      if (e.target.checked && index != get(this, 'checked')) {
        set(this, 'checked', parseInt(index));
        this.$row = this.dom.closest('li', e.target);
        this.$row.style.zIndex = 1;

        const $group = this.dom.sibling(e.target, 'div');
        const groupRect = $group.getBoundingClientRect();
        const groupBottom = groupRect.top + $group.clientHeight;

        const $footer = this.dom.element('footer[role="contentinfo"]');
        const footerRect = $footer.getBoundingClientRect();
        const footerTop = footerRect.top;

        if (groupBottom > footerTop) {
          $group.classList.add('above');
        } else {
          $group.classList.remove('above');
        }
      } else {
        const $group = this.dom.sibling(e.target, 'div');
        $group.classList.remove('above');
        set(this, 'checked', null);
        this.$row.style.zIndex = null;
      }
    },
  },
});
