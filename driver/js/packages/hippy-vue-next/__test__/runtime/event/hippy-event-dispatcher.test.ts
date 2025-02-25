/*
 * Tencent is pleased to support the open source community by making
 * Hippy available.
 *
 * Copyright (C) 2017-2022 THL A29 Limited, a Tencent company.
 * All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * runtime/event/hippy-event-dispatcher unit test
 * event-dispatcher is mounted on global.__GLOBAL__，which can be mocked to trigger native events
 */

import '../../../src/runtime/event/hippy-event-dispatcher';
import { createRenderer } from '@vue/runtime-core';

import type { NeedToTyped } from '../../../src/types';
import { nodeOps } from '../../../src/node-ops';
import { patchProp } from '../../../src/patch-prop';
import type { ElementComponent } from '../../../src/runtime/component/index';
import { registerElement } from '../../../src/runtime/component/index';
import { HippyElement } from '../../../src/runtime/element/hippy-element';
import { EventBus } from '../../../src/runtime/event/event-bus';
import {
  setHippyCachedInstanceParams,
  setHippyCachedInstance,
} from '../../../src/util/instance';
import { preCacheNode } from '../../../src/util/node';
import { EventsUnionType } from '../../../src/runtime/event/hippy-event';
import BuiltInComponent from '../../../src/built-in-component';

/**
 * @author birdguo
 * @priority P0
 * @casetype unit
 */
describe('runtime/event/hippy-event-dispatcher.ts', () => {
  beforeAll(() => {
    BuiltInComponent.install();
    const root = new HippyElement('div');
    root.id = 'testRoot';
    setHippyCachedInstance({
      rootView: 'testRoot',
      rootContainer: 'root',
      rootViewId: 1,
      ratioBaseWidth: 750,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      instance: {
        $el: root,
      },
    });
  });

  it('HippyEvent instance should have required function', async () => {
    const { EventDispatcher: eventDispatcher } = global.__GLOBAL__.jsModuleList;
    expect(eventDispatcher).toHaveProperty('receiveNativeEvent');
    expect(eventDispatcher).toHaveProperty('receiveComponentEvent');
  });

  it('hippy-event-dispatcher should dispatch native gesture event and ui event correctly', async () => {
    const { EventDispatcher: eventDispatcher } = global.__GLOBAL__.jsModuleList;
    const divElement = new HippyElement('div');

    const divComponent: ElementComponent = {
      component: {
        name: 'div',
        eventNamesMap: new Map().set('click', 'onClick'),
        defaultNativeStyle: {},
        defaultNativeProps: {},
        nativeProps: {},
        attributeMaps: {},
      },
    };

    registerElement('div', divComponent);

    let sign = 0;

    setHippyCachedInstance({
      rootViewId: 0,
      superProps: {},
      app: createRenderer({
        patchProp,
        ...nodeOps,
      }).createApp({
        template: '<div></div>',
      }),
      ratioBaseWidth: 750,
    });

    // set app instance
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    setHippyCachedInstanceParams('instance', {
      $el: divElement,
    });

    // pre cache node
    preCacheNode(divElement, divElement.nodeId);

    const clickCb = () => {
      sign = 1;
    };
    // click event
    divElement.addEventListener('click', clickCb);
    const nativeEvent: NeedToTyped = {
      id: divElement.nodeId,
      currentId: divElement.nodeId,
      nativeName: 'onClick',
      originalName: 'click',
      params: {
        keyboardHeight: 100,
      },
    };
    eventDispatcher.receiveComponentEvent(nativeEvent, {
      eventPhase: 2,
    });
    expect(sign).toEqual(1);

    // endReached event
    divElement.addEventListener('endReached', () => {
      sign = 3;
    });
    let nativeUIEvent: NeedToTyped = {
      id: divElement.nodeId,
      currentId: divElement.nodeId,
      nativeName: 'onEndReached',
      originalName: 'endReached',
      params: {
        keyboardHeight: 100,
      },
    };
    eventDispatcher.receiveComponentEvent(nativeUIEvent, {
      eventPhase: 2,
    });
    expect(sign).toEqual(3);

    // scroll event
    divElement.addEventListener('scroll', () => {
      sign = 4;
    });

    const scrollEvent: NeedToTyped = {
      id: divElement.nodeId,
      currentId: divElement.nodeId,
      nativeName: 'onScroll',
      originalName: 'scroll',
      params: {
        keyboardHeight: 100,
      },
    };
    eventDispatcher.receiveComponentEvent(scrollEvent, {
      eventPhase: 2,
    });
    expect(sign).toEqual(4);

    // layout event
    divElement.addEventListener('layout', (result) => {
      sign = result.top;
    });
    nativeUIEvent = {
      id: divElement.nodeId,
      currentId: divElement.nodeId,
      nativeName: 'onLayout',
      originalName: 'layout',
      params: {
        layout: {
          y: 10,
        },
      },
    };
    eventDispatcher.receiveComponentEvent(nativeUIEvent, {
      eventPhase: 2,
    });
    expect(sign).toEqual(10);
    // dispatch click event again
    eventDispatcher.receiveComponentEvent(nativeEvent, {
      eventPhase: 2,
    });
    expect(sign).toEqual(1);
    // remove click event
    divElement.removeEventListener('click', clickCb);
    // dispatch ui event
    eventDispatcher.receiveComponentEvent(nativeUIEvent, {
      eventPhase: 2,
    });
    expect(sign).toEqual(10);
    // dispatch click when click event removed
    eventDispatcher.receiveComponentEvent(nativeEvent, {
      eventPhase: 2,
    });
    expect(sign).toEqual(10);

    // span component
    const li: ElementComponent = {
      component: {
        name: 'ListViewItem',
      },
    };
    registerElement('li', li);
    const listItemElement = new HippyElement('li');
    // pre cache node
    preCacheNode(listItemElement, listItemElement.nodeId);
    const listCb = () => {
      sign = 5;
    };
    // ios still use disappear
    listItemElement.addEventListener('disappear', listCb);
    const disappearEvent: NeedToTyped = {
      id: listItemElement.nodeId,
      currentId: listItemElement.nodeId,
      nativeName: 'onDisappear',
      originalName: 'disappear',
      params: {
        keyboardHeight: 100,
      },
    };
    // dispatch disappear event
    eventDispatcher.receiveComponentEvent(disappearEvent, {
      eventPhase: 2,
    });
    expect(sign).toEqual(5);

    // nothing happen when there is no listener
    const noListenerElement = new HippyElement('li');
    // pre cache node
    preCacheNode(noListenerElement, noListenerElement.nodeId);
    const noListenerEvent: NeedToTyped = {
      id: noListenerElement.nodeId,
      currentId: noListenerElement.nodeId,
      nativeName: 'onClick',
      originalName: 'click',
      params: {},
    };
    // dispatch click event
    eventDispatcher.receiveComponentEvent(noListenerEvent, {
      eventPhase: 2,
    });
  });

  it('hippy-event-dispatcher should dispatch native event correctly', async () => {
    const { EventDispatcher: eventDispatcher } = global.__GLOBAL__.jsModuleList;

    let sign = 0;

    EventBus.$on('pageVisible', () => {
      sign = 1;
    });
    // invalid native event
    eventDispatcher.receiveNativeEvent(['pageVisible']);
    expect(sign).toEqual(0);
    eventDispatcher.receiveNativeEvent();
    expect(sign).toEqual(0);

    eventDispatcher.receiveNativeEvent(['pageVisible', null]);
    expect(sign).toEqual(1);
  });

  it('can not find node should not trigger anything', () => {
    const { EventDispatcher: eventDispatcher } = global.__GLOBAL__.jsModuleList;
    const divElement = new HippyElement('div');
    const clickEvent: NeedToTyped = {
      id: divElement.nodeId,
      currentId: divElement.nodeId,
      nativeName: 'onClick',
      originalName: 'click',
      params: {},
    };
    let sign = 1;
    divElement.addEventListener('click', () => {
      sign += 1;
    });
    // dispatch click event, but can not find node, should not trigger anything
    eventDispatcher.receiveComponentEvent(clickEvent, {
      eventPhase: 2,
    });
    expect(sign).toEqual(1);
  });

  it('no event should not trigger anything', () => {
    const { EventDispatcher: eventDispatcher } = global.__GLOBAL__.jsModuleList;
    const divElement = new HippyElement('div');
    let sign = 1;
    divElement.addEventListener('click', () => {
      sign += 1;
    });
    // dispatch click event, but no event object, should not trigger anything
    eventDispatcher.receiveComponentEvent();
    expect(sign).toEqual(1);
  });

  it('processEventData can process event before dispatch', () => {
    const { EventDispatcher: eventDispatcher } = global.__GLOBAL__.jsModuleList;
    const div: ElementComponent = {
      component: {
        name: 'View',
        processEventData(evtData: EventsUnionType, nativeEventParams: NeedToTyped) {
          const { handler: event, __evt: nativeEventName } = evtData;

          switch (nativeEventName) {
            case 'onScroll':
              event.offsetX = nativeEventParams.contentOffset?.x;
              event.offsetY = nativeEventParams.contentOffset?.y;
              break;
            default:
              break;
          }
          return event;
        },
      },
    };
    let sign = 0;
    registerElement('list', div);

    const divElement = new HippyElement('list');
    preCacheNode(divElement, divElement.nodeId);
    // scroll event
    divElement.addEventListener('scroll', (event) => {
      sign = event.offsetY;
    });
    const scrollEvent: NeedToTyped = {
      id: divElement.nodeId,
      currentId: divElement.nodeId,
      nativeName: 'onScroll',
      originalName: 'scroll',
      params: {
        contentOffset: {
          x: 1,
          y: 2,
        },
      },
    };
    eventDispatcher.receiveComponentEvent(scrollEvent, {
      eventPhase: 2,
    });
    expect(sign).toEqual(2);
  });
});
