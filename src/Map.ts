import { h, defineComponent, getCurrentInstance, provide, inject, ref } from 'vue';
import * as utils from './utils';
import { MapSettings, MarkerAction, MapType } from './types';
import useGeoObjectActions from './use-marker-actions';

export default defineComponent({
  name: 'YandexMap',
  props: {
    coords: {
      type: Array as () => number[],
      required: true,
    },
    zoom: {
      type: Number,
      default: 10,
    },
    bounds: {
      type: Array as () => number[][],
    },
    behaviors: {
      type: Array as () => string[],
    },
    controls: {
      type: Array as () => string[],
    },
    mapType: {
      type: String,
      default: 'map',
    },
    settings: {
      type: Object as () => MapSettings,
      default: () => ({}),
    },
    debug: Boolean,
  },
  setup(props, { slots, emit }) {
    const isReady = ref(false);
    const pluginOptions: MapSettings | undefined = inject('pluginOptions');
    console.log(pluginOptions);
    let map: ymaps.Map | undefined;
    const ymapId = `yandexMap${Math.round(Math.random() * 100000)}`;

    const updateGeoObjects = (arr: ymaps.GeoObject[], action: 'add' | 'remove') => {
      if (!map || !arr.length) return;

      arr.forEach((geoObject) => map?.geoObjects[action](geoObject));

      emit('geoObjectsUpdated', map.geoObjects);
      arr = [];
    };

    const { addGeoObject, deleteGeoObject } = useGeoObjectActions(updateGeoObjects);

    provide('geoObjectActions', { addGeoObject, deleteGeoObject });

    // Map initialization
    const init = () => {
      isReady.value = true;
      map = new ymaps.Map(ymapId, {
        center: props.coords,
        zoom: props.zoom,
        bounds: props.bounds,
        behaviors: props.behaviors,
        controls: props.controls,
        type: `yandex#${props.mapType}` as MapType,
      });
    };

    if (utils.emitter.scriptIsNotAttached) {
      const instance = getCurrentInstance();
      console.log(instance);
      const settings = { ...pluginOptions, ...props.settings };
      utils.ymapLoader(settings);
    }
    if (utils.emitter.ymapReady) {
      ymaps.ready(init);
    } else {
      utils.emitter.$on('scriptIsLoaded', init);
    }

    return () =>
      h('section', { class: 'ymap-container' }, [
        h('div', { id: ymapId, style: 'min-height: 100%;' }),
        isReady.value && h('div', [slots.default?.()]),
      ]);
  },
});
