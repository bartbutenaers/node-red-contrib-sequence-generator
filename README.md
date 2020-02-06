# node-red-contrib-sequence-generator
A Node-RED node to generate a sequence of messages

## Install
Run the following npm command in your Node-RED user directory (typically ~/.node-red):
```
npm install node-red-contrib-sequence-generator
```

## Node usage

```
[{"id":"de620df7.cf8a","type":"sequence-generator","z":"b8457951.1c27e8","name":"","interval":500,"maximumTickCount":"","outputType":"list","intervalunit":"msecs","stepSize":10,"stepUnit":"fixed","minValue":0,"maxValue":100,"operation":"operation","operationType":"msg","algorithm":"uuidv1","fixedValue":1,"fixedValueType":"num","valueList":"[\"A\",\"B\",\"C\"]","valueListType":"json","loopType":"repeat","inputField":"payload","inputFieldType":"msg","outputField":"payload","outputFieldType":"msg","startCommand":"START","startCommandType":"str","stopCommand":"STOP","stopCommandType":"str","x":500,"y":600,"wires":[["54a39a2c.a4cec4"]]},{"id":"6452c297.0d930c","type":"inject","z":"b8457951.1c27e8","name":"Start sequence","topic":"","payload":"START","payloadType":"str","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":260,"y":600,"wires":[["de620df7.cf8a"]]},{"id":"325cc5d5.cab32a","type":"inject","z":"b8457951.1c27e8","name":"Stop sequence","topic":"","payload":"STOP","payloadType":"str","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":260,"y":640,"wires":[["de620df7.cf8a"]]},{"id":"54a39a2c.a4cec4","type":"debug","z":"b8457951.1c27e8","name":"Show sequence","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","targetType":"msg","x":720,"y":600,"wires":[]},{"id":"f2090e18.e616c","type":"comment","z":"b8457951.1c27e8","name":"Sequence of array A, B, C","info":"","x":270,"y":560,"wires":[]},{"id":"308529d.e7a54d6","type":"change","z":"b8457951.1c27e8","name":"operation = \"incr\"","rules":[{"t":"set","p":"operation","pt":"msg","to":"incr","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":470,"y":740,"wires":[["8407753c.d656e8"]]},{"id":"8407753c.d656e8","type":"sequence-generator","z":"b8457951.1c27e8","name":"","interval":500,"maximumTickCount":"","outputType":"range","intervalunit":"msecs","stepSize":10,"stepUnit":"fixed","minValue":0,"maxValue":"50","operation":"operation","operationType":"msg","algorithm":"uuidv1","fixedValue":1,"fixedValueType":"num","valueList":"[\"A\",\"B\",\"C\"]","valueListType":"json","loopType":"back","inputField":"payload","inputFieldType":"msg","outputField":"payload","outputFieldType":"msg","startCommand":"START","startCommandType":"str","stopCommand":"STOP","stopCommandType":"str","x":700,"y":740,"wires":[["70a31093.1b912"]]},{"id":"81ceaf2f.678f3","type":"inject","z":"b8457951.1c27e8","name":"Start sequence","topic":"","payload":"START","payloadType":"str","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":240,"y":740,"wires":[["308529d.e7a54d6"]]},{"id":"b82bb97c.0c9798","type":"inject","z":"b8457951.1c27e8","name":"Stop sequence","topic":"","payload":"STOP","payloadType":"str","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":240,"y":780,"wires":[["308529d.e7a54d6"]]},{"id":"70a31093.1b912","type":"debug","z":"b8457951.1c27e8","name":"Show sequence","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","targetType":"msg","x":920,"y":740,"wires":[]},{"id":"e29d3854.494e88","type":"comment","z":"b8457951.1c27e8","name":"Sequence of array A, B, C","info":"","x":250,"y":700,"wires":[]}]
```

## Node configuration

### Interval
The time interval between successive output messages.
    
### Max. count
When a number N is specified, the output sequence will be stopped automatically after N output messages.  When empty or zero, the output sequence will keep on going...

### Output type
A series of output types are available, to generate different kinds of sequences:

+ *Number range* to output incremented/decremented numbers (with a specified step size) between a minimum and maximum value.
+ *Fixed value* to output constant values.
+ *Random number between* to output random numbers between a minimum and maximum value.
+ *Unique id* to output unique GUIDS of a specified format.
+ *Value list* to output the items from a predefined array of values.
+ *None* to output clones of the original input message (i.e. to resend the input message).

Depending on the output type, the related settings can be entered.

### Input field
The name of the field from the input message (e.g. <code>msg.control</code>), that will contain the start and stop commands.

### Start cmd
The command that will arrive (via the input field) to start a new output sequence.  For example "ON", "1", "true", ...

### Stop cmd
The command that will arrive (via the input field) to stop the current output sequence.  For example "OFF", "0", "false", ...

### Output field
The name of the field in the output message (e.g. <code>msg.payload</code>), where the sequence value needs to be stored. 
