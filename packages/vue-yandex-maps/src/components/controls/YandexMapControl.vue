<script lang="ts">
import type { PropType, SlotsType } from 'vue';
import { computed, defineComponent, h, onMounted, ref } from 'vue';
import type { YMapControl } from '@yandex/ymaps3-types';

import { setupMapChildren } from '../../utils/setupMapChildren.ts';
import { getAttrsForVueVersion, hF } from '../../utils/system.ts';

export default defineComponent({
    name: 'YandexMapControl',
    props: {
        value: {
            type: Object as PropType<YMapControl | null>,
            default: null,
        },
        modelValue: {
            type: Object as PropType<YMapControl | null>,
            default: null,
        },
        settings: {
            type: Object as PropType<NonNullable<ConstructorParameters<typeof YMapControl>[0]>>,
            default: () => ({}),
        },
    },
    emits: {
        'input'(item: YMapControl): boolean {
            return true;
        },
        'update:modelValue'(item: YMapControl): boolean {
            return true;
        },
    },
    slots: Object as SlotsType<{
        default: {};
    }>,
    setup(props, {
        slots,
        emit,
        attrs,
    }) {
        let mapChildren: YMapControl | undefined;
        const element = ref<null | HTMLDivElement>(null);

        onMounted(async () => {
            mapChildren = await setupMapChildren({
                createFunction: () => new ymaps3.YMapControl(props.settings, element.value!),
                settings: computed(() => props.settings),
                strictMapRoot: true,
            });
            emit('input', mapChildren);
            emit('update:modelValue', mapChildren);
        });

        return () => hF([
            h('div', {
                ref: element,
                ...getAttrsForVueVersion(attrs),
            }, slots.default?.({})),
        ]);
    },
});
</script>
