/**
 * Copyright 2020 Bart Butenaers
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
 module.exports = function(RED) {
    var settings = RED.settings;
    const uuidv1 = require('uuid/v1')
    const uuidv4 = require('uuid/v4')

    function SequenceGeneratorNode(config) {
        RED.nodes.createNode(this, config);
        this.interval         = parseInt(config.interval);
        this.maximumTickCount = parseInt(config.maximumTickCount);
        this.outputType       = config.outputType;
        this.stepSize         = parseInt(config.stepSize);
        this.stepUnit         = config.stepUnit;
        this.minValue         = parseInt(config.minValue);
        this.maxValue         = parseInt(config.maxValue);
        this.operation        = config.operation;
        this.operationType    = config.operationType;
        this.loopType         = config.loopType;
        this.algorithm        = config.algorithm;
        this.inputField       = config.inputField;
        this.outputField      = config.outputField;
        this.fixedValueType   = config.fixedValueType;

        var node = this;
        
        // Convert the 'interval' value to milliseconds (based on the selected time unit)
        switch(config.intervalunit) {
            case "secs":
                this.interval *= 1000;
                break;
            case "mins":
                this.interval *= 1000 * 60;
                break;
            case "hours":
                this.interval *= 1000 * 60 * 60;
                break;            
            default: // "msecs" so no conversion needed
        }
        
        // Convert the start/stop commands to the correct values (e.g. "str" should be a String object)
        node.startCommandValue = RED.util.evaluateNodeProperty(config.startCommand, config.startCommandType, node);
        node.stopCommandValue = RED.util.evaluateNodeProperty(config.stopCommand, config.stopCommandType, node);
        
        // Convert the fixed value to the correct value (e.g. "str" should be a String object)
        node.fixedValueValue = RED.util.evaluateNodeProperty(config.fixedValue, config.fixedValueType, node); 

        switch (node.outputType) {
            case "range":
                if (node.stepUnit === "perc") {
                    node.stepSize = (node.maxValue - node.minValue) * node.stepSize / 100;
                }
                break;
            case "list":
                // Convert the value list to the correct value, i.e. an array that we start reading from index 0
                node.valueListValue = RED.util.evaluateNodeProperty(config.valueList, config.valueListType, node);
                if (!Array.isArray(node.valueListValue)) {
                    node.error("The value list JSON should contain an array of values");
                    node.valueListValue = null;
                }
                else if (node.valueListValue.length < 2) {
                    node.error("The value list JSON array should contain at least 2 values");
                    node.valueListValue = null;
                }
                break;
        }

        function stopGenerator(node) {
            if (node.timerid) {
                clearInterval(node.timerid);
                node.timerid = null;
            }
            
            delete node.previousValue;
        }        
        
        function handleTimerTick(msg) {
            var newValue;

            switch(node.outputType) {
                case "range":
                    // An operation need to be available, otherwise we don't know what to calculate...
                    if (node.currentOperation) {
                        // The value cannot exceed node.minValue and node.maxValue
                        node.currentRangeValue = Math.min(node.maxValue, node.currentRangeValue);
                        node.currentRangeValue = Math.max(node.minValue, node.currentRangeValue);
                        
                        newValue = node.currentRangeValue;
                        
                        // Determine what to do when the minimum or maximum has been reached
                        switch (node.currentOperation) {
                            case "incr":
                                // When the maximum has been reached (while incrementing)...
                                if (node.currentRangeValue === node.maxValue) {
                                    switch(node.loopType) {
                                        case "repeat":
                                            node.currentOperation = "incr";
                                            node.currentRangeValue = node.minValue;
                                            break;
                                        case "back":
                                            node.currentOperation = "decr";
                                            node.currentRangeValue -= node.stepSize;
                                            break;      
                                        case "stop":
                                            stopGenerator(node);
                                            break;                                         
                                    }
                                }
                                else {
                                    node.currentRangeValue += node.stepSize;
                                }
                                break;
                            case "decr":
                                // When the minimum value has been reached (while incrementing)...
                                if (node.currentRangeValue === node.minValue) {
                                    switch(node.loopType) {
                                        case "repeat":
                                        case "back":
                                            node.currentOperation = "incr";
                                            node.currentRangeValue += node.stepSize;
                                            break;  
                                        case "stop":
                                            stopGenerator(node);
                                            break;                                           
                                    }
                                }
                                else {
                                    node.currentRangeValue -= node.stepSize;
                                }                                
                        }
                    }
                    break;
                case "fixed":
                    // Always use the same fixed value
                    newValue = node.fixedValueValue;
                    break;
                case "random":
                    // Calculate a random value between the specified minimum and maximum limits
                    newValue = Math.floor(Math.random() * node.maxValue) + node.minValue;
                    break;
                case "unique":
                    // Generate a unique UUID of the specified algorithm
                    switch(node.algorithm) {
                        case "uuidv1":
                            newValue = uuidv1();
                            break;
                        case "uuidv4":
                            newValue = uuidv4();
                            break;
                    }
                    break;
                case "list":
                    if (node.valueListValue) {
                        switch (node.currentLoopDirection) {
                            case "incr":
                                // When end of the array reached (while incrementing)...
                                if (node.currentListIndex === node.valueListValue.length) {
                                    switch(node.loopType) {
                                        case "repeat":
                                            node.currentListIndex = 0;
                                            node.currentLoopDirection = "incr";
                                            break;
                                        case "back":
                                            // Make sure the last element is not send twice in sequence
                                            node.currentListIndex = node.valueListValue.length - 2;
                                            node.currentLoopDirection = "decr";
                                            break;      
                                        case "stop":
                                            stopGenerator(node);
                                            return; // All values have been send
                                    }
                                }
                                break;
                            case "decr":
                                // When end of the array reached (while incrementing)...
                                if (node.currentListIndex < 0) {
                                    switch(node.loopType) {
                                        case "repeat":
                                            node.currentListIndex = 0;
                                            node.currentLoopDirection = "incr";
                                            break;
                                        case "back":
                                            // Make sure the first element is not send twice in sequence
                                            node.currentListIndex = 1;
                                            node.currentLoopDirection = "incr";
                                            break;    
                                        case "stop":
                                            stopGenerator(node);
                                            return; // All values have been send                                
                                    }
                                }   
                                break;
                        }
                        
                        // Get the item from the array
                        newValue = node.valueListValue[node.currentListIndex];
                        
                        // Navigate to the next position in the array (based on the direction)
                        switch(node.currentLoopDirection) {
                            case "incr":
                                node.currentListIndex++;
                                break;
                            case "decr":
                                node.currentListIndex--;
                                break;                                
                        }
                    }
                    break;
                case "none":
                    // Send the orginal input message, so do nothing ...
                    break;
            }
            
            var outputMessage  = RED.util.cloneMessage(msg);

            if (node.outputType === "none") {
                node.status({ fill: 'blue', shape: 'dot', text: "input msg" });
            }
            else if (node.outputType === "fixed" && node.fixedValueType === "json") {
                node.status({ fill: 'blue', shape: 'dot', text: "JSON" });
            }
            else {
                // TODO ?????? if (node.context().get('value') === newValue) return
                node.status({ fill: 'blue', shape: 'dot', text: newValue.toString() });
                RED.util.setMessageProperty(outputMessage, node.outputField, newValue, true);
            }

            node.send(outputMessage);
            
            node.previousValue = newValue;
        }
        
        node.on("input", function(msg) {
            // Get the command specified in the input message
            var inputValue = RED.util.getMessageProperty(msg, node.inputField);
            
            // The command should be equal to the specified ON or OFF commands
            if (node.startCommandValue === inputValue) {
                stopGenerator(node);
                
                // Depending on the output type, so information might be available in the input message
                switch(node.outputType) {
                    case "range":
                        // The operation can be "incr", "decr" or "msg".
                        // When the operation is "msg", then get "incr", "decr" from the input message...
                        node.currentOperation = node.operationType;
                    
                        if (node.operationType === 'msg') {
                            // Get the operation from the input message
                            node.currentOperation = RED.util.getMessageProperty(msg, node.operation);
                            
                            if (node.currentOperation !== "incr" && node.currentOperation !== "decr") {
                                node.error("The operation in the msg." + node.operation + " should be 'incr' or 'decr'");
                                node.currentOperation = null;
                            }
                        }
                        
                        if (node.currentOperation) {
                            // When no previous value available, start calculating from the minimum or maximum value (depending on the operation)
                            switch(node.currentOperation) {
                                case "incr":
                                    node.currentRangeValue = node.minValue;
                                    break;
                                case "decr":
                                    node.currentRangeValue = node.maxValue;
                                    break;   
                            }
                        }
                        
                        break;
                    case "list":
                        node.currentListIndex = 0;
                        node.currentLoopDirection = "incr";
                        break;
                }

                node.tickCounter = 0;
                
                // Start a new timer
                node.timerid = setInterval(function() {
                    handleTimerTick(msg);
                    
                    node.tickCounter++;
                    
                    // The tick counter is only relevant when a maximumTickCount has been specified
                    if (node.maximumTickCount && node.maximumTickCount > 0 && node.tickCounter >= node.maximumTickCount) {
                        stopGenerator(node);
                    }
                }, node.interval);
            }
            else if (node.stopCommandValue === inputValue) {
                stopGenerator(node);
            }
            else {
                node.error("The input msg." + node.inputField + " field should contain the specified Start/Stop commands");
                node.status({ fill: 'red', shape: 'dot', text: "Invalid input" });
            }
        });

        node.on("close", function() {
            stopGenerator(node);
            
            node.status({ });
        });
    }

    RED.nodes.registerType("sequence-generator", SequenceGeneratorNode);
}