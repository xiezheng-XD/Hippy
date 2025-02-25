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
#import "HPImageProviderProtocol.h"
#import "NativeRenderAnimatedImageView.h"

extern const NSTimeInterval kAnimatedImageDelayTimeIntervalMinimum;

//
//  An `NativeRenderAnimatedImage`'s job is to deliver frames in a highly performant way and works in conjunction with `NativeRenderAnimatedImageView`.
//  It subclasses `NSObject` and not `UIImage` because it's only an "image" in the sense that a sea lion is a lion.
//  It tries to intelligently choose the frame cache size depending on the image and memory situation with the goal to lower CPU usage for smaller
//  ones, lower memory usage for larger ones and always deliver frames for high performant play-back. Note: `posterImage`, `size`, `loopCount`,
//  `delayTimes` and `frameCount` don't change after successful initialization.
//
@interface NativeRenderAnimatedImage : NSObject

@property (nonatomic, strong, readonly) UIImage *posterImage;  // Guaranteed to be loaded; usually equivalent to `-imageLazilyCachedAtIndex:0`
@property (nonatomic, assign, readonly) CGSize size;           // The `.posterImage`'s `.size`

@property (nonatomic, assign, readonly) NSUInteger loopCount;                // 0 means repeating the animation indefinitely
@property (nonatomic, strong, readonly) NSDictionary *delayTimesForIndexes;  // Of type `NSTimeInterval` boxed in `NSNumber`s
@property (nonatomic, assign, readonly) NSUInteger frameCount;               // Number of valid frames; equal to `[.delayTimes count]`

@property (nonatomic, assign, readonly)
    NSUInteger frameCacheSizeCurrent;  // Current size of intelligently chosen buffer window; can range in the interval [1..frameCount]
@property (nonatomic, assign) NSUInteger frameCacheSizeMax;  // Allow to cap the cache size; 0 means no specific limit (default)

// Intended to be called from main thread synchronously; will return immediately.
// If the result isn't cached, will return `nil`; the caller should then pause playback, not increment frame counter and keep polling.
// After an initial loading time, depending on `frameCacheSize`, frames should be available immediately from the cache.
- (UIImage *)imageLazilyCachedAtIndex:(NSUInteger)index;

// Pass either a `UIImage` or an `NativeRenderAnimatedImage` and get back its size
+ (CGSize)sizeForImage:(id)image;

- (UIImage *)imageAtIndex:(NSUInteger)index;

- (instancetype)initWithAnimatedImageProvider:(id<HPImageProviderProtocol>)imageProvider;
- (instancetype)initWithAnimatedImageProvider:(id<HPImageProviderProtocol>)imageProvider
                        optimalFrameCacheSize:(NSUInteger)optimalFrameCacheSize
                            predrawingEnabled:(BOOL)isPredrawingEnabled;
+ (instancetype)animatedImageWithAnimatedImageProvider:(id<HPImageProviderProtocol>)imageProvider;

// On success, the initializers return an `NativeRenderAnimatedImage` with all fields initialized, on failure they return `nil` and an error will be logged.
- (instancetype)initWithAnimatedGIFData:(NSData *)data;
// Pass 0 for optimalFrameCacheSize to get the default, predrawing is enabled by default.
- (instancetype)initWithAnimatedGIFData:(NSData *)data
                  optimalFrameCacheSize:(NSUInteger)optimalFrameCacheSize
                      predrawingEnabled:(BOOL)isPredrawingEnabled;
+ (instancetype)animatedImageWithGIFData:(NSData *)data;

@property (nonatomic, strong, readonly) NSData *data;  // The data the receiver was initialized with; read-only
@property (nonatomic, strong, readonly) id<HPImageProviderProtocol> imageProvider;

@end

typedef NS_ENUM(NSUInteger, RAILogLevel) {
    RAILogLevelNone = 0,
    RAILogLevelError,
    RAILogLevelWarn,
    RAILogLevelInfo,
    RAILogLevelDebug,
    RAILogLevelVerbose
};

@interface NativeRenderAnimatedImage (Logging)

+ (void)setLogBlock:(void (^)(NSString *logString, RAILogLevel logLevel))logBlock logLevel:(RAILogLevel)logLevel;
+ (void)logStringFromBlock:(NSString * (^)(void))stringBlock withLevel:(RAILogLevel)level;

@end

#define RAILog(logLevel, format, ...)
//[NativeRenderAnimatedImage logStringFromBlock:^NSString *{ return [NSString stringWithFormat:(format), ## __VA_ARGS__]; } withLevel:(logLevel)]

@interface NativeRenderWeakProxy : NSProxy

+ (instancetype)weakProxyForObject:(id)targetObject;

@end
