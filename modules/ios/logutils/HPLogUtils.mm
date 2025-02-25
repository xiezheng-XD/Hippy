/*
 *
 * Tencent is pleased to support the open source community by making
 * Hippy available.
 *
 * Copyright (C) 2019 THL A29 Limited, a Tencent company.
 * All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

#import "HPLogUtils.h"

#include <mutex>
#include <sstream>

#include "footstone/log_level.h"
#include "footstone/logging.h"

using LogSeverity = footstone::LogSeverity;

static HPLogLevel logSeverityToLogLevel(LogSeverity severity) {
    HPLogLevel level = HPLogLevelInfo;
    switch (severity) {
        case LogSeverity::TDF_LOG_WARNING:
            level = HPLogLevelWarning;
            break;
        case LogSeverity::TDF_LOG_ERROR:
            level = HPLogLevelError;
            break;
        case LogSeverity::TDF_LOG_FATAL:
            level = HPLogLevelFatal;
            break;
        default:
            break;
    }
    return level;
}

static BOOL GetFileNameAndLineNumberFromLogMessage(NSString *message, NSString **fileName, int *lineNumber) {
    //[INFO:cubic_bezier_animation.cc(146)] animation exec_time_ = 514, delay = 500, duration = 1000
    NSUInteger locationOfColon = [message rangeOfString:@":"].location;
    if (NSNotFound == locationOfColon) {
        return NO;
    }
    NSUInteger locationOfLeftBracket = [message rangeOfString:@"("].location;
    if (NSNotFound == locationOfLeftBracket) {
        return NO;
    }
    if (locationOfLeftBracket <= locationOfColon) {
        return NO;
    }
    NSString *name = [message substringWithRange:NSMakeRange(locationOfColon + 1, locationOfLeftBracket - locationOfColon - 1)];
    *fileName = [name copy];
    NSUInteger locationOfRightBracket = [message rangeOfString:@")"].location;
    if (NSNotFound == locationOfRightBracket || locationOfRightBracket <= locationOfLeftBracket) {
        return YES;
    }
    NSString *number = [message substringWithRange:NSMakeRange(locationOfLeftBracket + 1, locationOfRightBracket - locationOfLeftBracket - 1)];
    *lineNumber = [number intValue];
    return YES;
}

static void registerTDFLogHandler() {
    static std::once_flag flag;
    std::call_once(flag, [](){
        auto logFunction = [](const std::ostringstream &stream, LogSeverity serverity) {
            @autoreleasepool {
                std::string string = stream.str();
                if (string.length()) {
                    NSString *message = [NSString stringWithUTF8String:string.c_str()];
                    NSString *fileName = nil;
                    int lineNumber = 0;
                    if (GetFileNameAndLineNumberFromLogMessage(message, &fileName, &lineNumber)) {
                        HPLogNativeInternal(logSeverityToLogLevel(serverity), [fileName UTF8String], lineNumber, nil, @"%@", message);
                    }
                }
            }
        };
        footstone::LogMessage::InitializeDelegate(logFunction);
    });
}

void HPSetTDFLogFunction(HPLogFunction logFunction) {
    registerTDFLogHandler();
    HPSetLogFunction(logFunction);
}
