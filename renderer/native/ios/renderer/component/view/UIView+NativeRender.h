/*!
 * iOS SDK
 *
 * Tencent is pleased to support the open source community by making
 * NativeRender available.
 *
 * Copyright (C) 2019 THL A29 Limited, a Tencent company.
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

#import <UIKit/UIKit.h>

#import "NativeRenderComponentProtocol.h"

@class NativeRenderObjectView;

@interface UIView (NativeRender) <NativeRenderComponentProtocol>

/**
 * NativeRenderComponent interface.
 */
- (void)insertNativeRenderSubview:(UIView *)subview atIndex:(NSInteger)atIndex;
- (void)moveNativeRenderSubview:(UIView *)subview toIndex:(NSInteger)atIndex;
- (void)removeNativeRenderSubview:(UIView *)subview;
- (void)resetNativeRenderSubviews;
- (void)clearSortedSubviews;
- (UIView *)NativeRenderRootView;
/**
 * z-index, used to override sibling order in didUpdateHippySubviews.
 */
@property (nonatomic, assign) NSInteger nativeRenderZIndex;

/**
 * set true when hippy subviews changed, but subviews does not.
 * set false after subviews does.
 */
@property (nonatomic, assign, getter=isNativeRenderSubviewsUpdated) BOOL nativeRenderSubviewsUpdated;

/**
 * The hippySubviews array, sorted by zIndex. This value is cached and
 * automatically recalculated if views are added or removed.
 */
@property (nonatomic, copy, readonly) NSArray<UIView *> *sortedNativeRenderSubviews;

/**
 * Updates the subviews array based on the hippySubviews. Default behavior is
 * to insert the sortedHippySubviews into the UIView.
 */
- (void)didUpdateNativeRenderSubviews;

/**
 * Used by the UIIManager to set the view frame.
 * May be overriden to disable animation, etc.
 */
- (void)nativeRenderSetFrame:(CGRect)frame;

/**
 * Used to improve performance when compositing views with translucent content.
 */
- (void)nativeRenderSetInheritedBackgroundColor:(UIColor *)inheritedBackgroundColor;

/**
 * This method finds and returns the containing view controller for the view.
 */
- (UIViewController *)nativeRenderViewController;

/**
 * CellView is reusable.
 * but sometimes it misdisplays.
 * this method is a plan B.
 * plan A is trying to find why
 */
- (BOOL)canBeRetrievedFromViewCache;

/**
 * This method attaches the specified controller as a child of the
 * the owning view controller of this view. Returns NO if no view
 * controller is found (which may happen if the view is not currently
 * attached to the view hierarchy).
 */
- (void)NativeRenderAddControllerToClosestParent:(UIViewController *)controller;

@property (nonatomic, weak) __kindof NativeRenderObjectView *nativeRenderObjectView;

@end
