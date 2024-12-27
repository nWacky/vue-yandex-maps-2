<template>
    <common-wrapper>
        <template
            #default="{
                coordinates: center, theme, width, height,
            }"
        >
            <button
                type="button"
                @click="visible = !visible"
            >
                Destroy map
            </button>

            <div>Selected marker id: {{ selectedMarkerId }}</div>

            <!-- #region html -->
            <yandex-map
                v-if="visible"
                v-model="map"
                cursor-grab
                :height="height"
                :settings="{
                    location: {
                        center,
                        zoom: 5,
                    },
                    theme,
                }"
                :width="width"
            >
                <yandex-map-default-scheme-layer/>
                <yandex-map-default-features-layer/>
                
                
                <yandex-map-controls :settings="{ position: 'right' }">
                    <yandex-map-zoom-control/>
                </yandex-map-controls>

                <!-- todo: v-model="clusterer" -->
                <yandex-map-clusterer
                    v-if="getPointList.length > 0"
                    :grid-size="2 ** gridSize"
                    zoom-on-cluster-click
                    :settings="{
                        features: getPointList,
                        marker: createMarker
                    }"
                    @trueBounds="trueBounds = $event"
                >
                    
                    <template #cluster="{ length }">
                        <div class="cluster fade-in">
                            {{ length }}
                        </div>
                    </template>
                </yandex-map-clusterer>
            </yandex-map>
            <!-- #endregion html -->
        </template>
    </common-wrapper>
</template>

<script setup lang="ts">
import CommonWrapper from '../CommonWrapper.vue';
// #region setup
import {
    YandexMap,
    YandexMapClusterer,
    YandexMapControl,
    YandexMapControlButton,
    YandexMapControls,
    YandexMapDefaultFeaturesLayer,
    YandexMapDefaultSchemeLayer,
    YandexMapZoomControl,
} from 'vue-yandex-maps';
import { computed, onMounted, ref, shallowRef, useCssModule, version, watch } from 'vue';
import { YMapMarker, type LngLat, type LngLatBounds, type YMap } from '@yandex/ymaps3-types';
import type { Feature as ClustererFeature } from '@yandex/ymaps3-types/packages/clusterer';
import type { YMapClusterer } from '@yandex/ymaps3-types/packages/clusterer';

const map = shallowRef<YMap | null>(null);
const clusterer = shallowRef<YMapClusterer | null>(null);
const visible = ref(true);
const count = ref(5000);
const savedCount = ref(5000);
const gridSize = ref(6);

const zoom = ref(0);
const bounds = ref<LngLatBounds>([[0, 0], [0, 0]]);
const trueBounds = ref<LngLatBounds>([[0, 0], [0, 0]]);

onMounted(() => {
    if (version.startsWith('2')) return;
    setInterval(() => {
        if (map.value) {
            zoom.value = map.value.zoom;
            bounds.value = map.value.bounds;
        }
    }, 1000);
});

watch(count, async val => {
    const oldVal = val;
    setTimeout(() => {
        if (oldVal !== count.value) return;
        savedCount.value = val;
    }, 500);
});

watch(map, val => console.log('map', val));
watch(clusterer, val => console.log('cluster', val));

const seed = (s: number) => () => {
    s = Math.sin(s) * 10000;
    return s - Math.floor(s);
};

const rnd = seed(10000);

const DELTA_LENGTH = 5;

function getRandomPoint(): LngLat {
    const [x, y] = map.value!.center;
    return [
        x + ((rnd() > 0.5 ? -1 : 1) * rnd() * DELTA_LENGTH * 2),
        y + ((rnd() > 0.5 ? -1 : 1) * rnd() * DELTA_LENGTH),
    ];
}

const getPointListList = computed(() => {
    if (!map.value) return [];

    const result: ClustererFeature[] = [];

    for (let i = 0; i < savedCount.value; i++) {
        const lngLat = getRandomPoint();


        result.push({
            type: 'Feature',
            id: `${i}`,
            geometry: {
                type: "Point",
                coordinates: lngLat
            }
        });
    }

    return result;
});


const hasPoints = ref(false);

onMounted(() => {
    setTimeout(() => {
        hasPoints.value = true;
    }, 5_000)
})

const getPointList = computed(() => {
    if (!hasPoints.value) {
        return [];
    }

    return getPointListList.value;
})


const allMarkers: Map<string, YMapMarker> = new Map()
const selectedMarkerId = ref<string | null>(null);

const updateMarker = (feature: ClustererFeature) => {
    const marker = allMarkers.get(feature.id);

    if (marker) {
        map.value?.removeChild(marker);
        marker.element.remove();

        allMarkers.delete(feature.id);
    }

    const newMarker = createMarker(feature);
    map.value?.addChild(newMarker);
}

const cssModule = useCssModule();
const createMarker = (feature: ClustererFeature) => {
    const featureCircle = document.createElement('div');
    featureCircle.classList.add(cssModule['feature-circle']);
    featureCircle.innerHTML = `<span>#${feature.id}</span>`

    if (feature.id == selectedMarkerId.value) {
        featureCircle.style.background = '#AC0707';
    }

    const yMapMarker = new ymaps3.YMapMarker(
        {
            id: feature.id,
            coordinates: feature.geometry.coordinates,
            onClick() {
                const prevSelectedId = selectedMarkerId.value;

                selectedMarkerId.value = feature.id;

                if (prevSelectedId) {
                    const previousFeature = getPointList.value.find((f) => f.id == prevSelectedId);

                    if (previousFeature) {
                        updateMarker(previousFeature);
                    }
                }
                
                updateMarker(feature);
            }
        },
        featureCircle
    );

    allMarkers.set(feature.id, yMapMarker);

    return yMapMarker;
}
// #endregion setup
</script>

<!-- #region style -->
<style scoped>
.bounds {
  user-select: all;
}

.cluster {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 50px;
  height: 50px;
  background: green;
  color: #fff;
  border-radius: 100%;
  cursor: pointer;
  border: 2px solid limegreen;
  outline: 2px solid green;
  text-align: center;
}

.padded {
  padding: 5px;
}

.fade-in {
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
</style>


<style module>
.feature-circle {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 100%;
    background: green;
    width: 40px;
    height: 40px;
    color: white;
    font-size: 12px;
}
</style>
<!-- #endregion style -->
