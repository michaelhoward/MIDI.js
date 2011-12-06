// Loading a MIDI file

var MIDIFile = new Object();

//var mtracks = new Array();
MIDIFile.tracks = [];

var fileloc = 0;
 
function LoadMIDI2(evt)
{
var reader = new FileReader();
reader.onerror = errorHandler;
reader.onload = completeHandler;
reader.readAsBinaryString(evt.target.files[0]);

}

var metaEventTypes = [];
var channelEventTypes = [];
var keySignatures = [];

var meta_sequenceNumber = 0;
var meta_textEvent = 1;
var meta_copyrightNotice = 2;
var meta_sequenceName = 3;
var meta_instrumentName = 4;
var meta_lyrics = 5;
var meta_marker = 6;
var meta_cuePoint = 7;
var meta_programName = 8;
var meta_deviceName = 9;
var meta_unknown0A = 0xA;
var meta_unknown0B = 0xB;
var meta_unknown0C = 0xC;
var meta_MIDIChannelPrefix = 32;
var meta_endOfTrack = 47;
var meta_setTempo = 81;
var meta_SMPTEOffset = 84;
var meta_timeSignature = 88;
var meta_keySignature = 89;
var meta_sequenceSpecific = 127;


metaEventTypes[meta_sequenceNumber] = "Sequence Number";
metaEventTypes[meta_textEvent] = "Text Event";
metaEventTypes[meta_copyrightNotice] = "Copyright Notice";
metaEventTypes[meta_sequenceName] = "Sequence/Track Name";
metaEventTypes[meta_instrumentName] = "Instrument Name";
metaEventTypes[meta_lyrics] = "Lyrics";
metaEventTypes[meta_marker] = "Marker";
metaEventTypes[meta_cuePoint] = "Cue Point";
metaEventTypes[meta_programName] = "Program Name";
metaEventTypes[meta_deviceName] = "Device (Port) Name";
metaEventTypes[meta_MIDIChannelPrefix] = "MIDI Channel Prefix";
metaEventTypes[meta_endOfTrack] = "End of Track";
metaEventTypes[meta_setTempo] = "Set Tempo";
metaEventTypes[meta_SMPTEOffset] = "SMPTE Offset";
metaEventTypes[meta_timeSignature] = "Time Signature";
metaEventTypes[meta_keySignature] = "Key Signature";
metaEventTypes[meta_sequenceSpecific] = "Sequence Specific Hardware Information";
metaEventTypes[meta_unknown0A] = "Unknown Meta Event - 0xA";
metaEventTypes[meta_unknown0B] = "Unknown Meta Event - 0xB";
metaEventTypes[meta_unknown0C] = "Unknown Meta Event - 0xC";



keySignatures[1] = "1 Sharp";
keySignatures[2] = "2 Sharps";
keySignatures[3] = "3 Sharps";
keySignatures[4] = "4 Sharps";
keySignatures[5] = "5 Sharps";
keySignatures[6] = "6 Sharps";
keySignatures[7] = "7 Sharps";
keySignatures[0] = "No Sharps";
keySignatures[255] = "1 Flat";
keySignatures[254] = "2 Flats";
keySignatures[253] = "3 Flats";
keySignatures[252] = "4 Flats";
keySignatures[251] = "5 Flats";
keySignatures[250] = "6 Flats";
keySignatures[249] = "7 Flats";

var event_noteOff = 0x80;
var event_noteOn = 0x90;
var event_noteAftertouch = 0xA0;
var event_controller = 0xB0;
var event_programChange = 0xC0;
var event_channelAftertouch = 0xD0;
var event_pitchBend = 0xE0;


channelEventTypes[event_noteOff] = "Note Off";
channelEventTypes[event_noteOn] = "Note On";
channelEventTypes[event_noteAftertouch] = "Note Aftertouch";
channelEventTypes[event_controller] = "Controller";
channelEventTypes[event_programChange] = "Program Change";
channelEventTypes[event_channelAftertouch] = "Channel Aftertouch";
channelEventTypes[event_pitchBend] = "Pitch Bend";



function errorHandler(evt)
{
    switch(evt.target.error.code) {
      case evt.target.error.NOT_FOUND_ERR:
        alert('File Not Found!');
        break;
      case evt.target.error.NOT_READABLE_ERR:
        alert('File is not readable');
        break;
      case evt.target.error.ABORT_ERR:
        break; // noop
      default:
        alert('An error occurred reading this file.');
    };
}

function completeHandler(evt)
{

var start = 0;
//var length = 4;

var file = evt.target.result;

readHeader(file);

readTracks(file);

document.getElementById("output").innerHTML=  writeHeader();
document.getElementById("output2").innerHTML=  writeTracks();

fileloc = 0;

}

function readHeader(file)
{
	MIDIFile.filelocation = fileloc;
	MIDIFile.chunkID = read4ByteCharacters(file);
	
	if (MIDIFile.chunkID != 'MThd')
	{
	alert('Invalid MIDI File');
	}

	MIDIFile.chunkSize = read4ByteNumber(file);
	MIDIFile.formatType = read2ByteNumber(file);
	MIDIFile.trackNum = read2ByteNumber(file);
	
	var timedivbytes = read2ByteNumber(file);
	MIDIFile.timeDivisionType = 0x8000 & timedivbytes;
	
	if (MIDIFile.timeDivisionType == 0)
	{ // Ticks per beat
	MIDIFile.timeDivision = 0x7FFF & timedivbytes;
	}
	if (MIDIFile.timeDivisionType == 1)
	{ //  Frames per second
		MIDIFile.framesPerSecond = 0x7F00 & timedivbytes;
		MIDIFile.ticksPerFrame = 0x00FF & timedivbytes;
	
	}

}



function readTracks(file, where)
{
var i = 0;
document.getElementById("output3").innerHTML = "Tracks to read: " + MIDIFile.trackNum + " ";
	for (i=0; i<MIDIFile.trackNum; i++)
	{
		MIDIFile.tracks[i] = new Object();
		MIDIFile.tracks[i].filelocation = fileloc;	
		MIDIFile.tracks[i].chunkID = read4ByteCharacters(file);
		
		if (MIDIFile.tracks[i].chunkID != 'MTrk')
		{
			alert('Invalid MIDI File - track data');
			return;
		
		}
	
	
		MIDIFile.tracks[i].chunkSize = read4ByteNumber(file);
		MIDIFile.tracks[i].events = [];
		
		/*
		for (var j=0; j<(MIDIFile.tracks[i].chunkSize); j++)
		{
		fileloc++;
		}
		*/
		
		var state = 0;
		var event= 0;
		var runningStatus = 0;
		var runningStatusChannel = 0;
		
		for (var j=0; j<(MIDIFile.tracks[i].chunkSize); j++)
		{
			var temp = read1ByteNumber(file);
		
			switch (state)
				{
				case 0:
				
				//create a midi event
				MIDIFile.tracks[i].events[event] = new Object();
				MIDIFile.tracks[i].events[event].deltaTime = 0;
				state = 1;
				
				case 1:
				// read variable length
				MIDIFile.tracks[i].events[event].deltaTime = MIDIFile.tracks[i].events[event].deltaTime << 7;
				MIDIFile.tracks[i].events[event].deltaTime += temp & 0x7F;
				//alert("Creating an event - setting delta time "+temp);
				if ((temp & 0x80 ) != 0x80)
				{
				//alert("End of variable length");
					state = 2;
				}
		
				break;
				case 2:
				// Read Event Type
				// Read MIDI Channel
				
				if (temp == 0xFF)
				{
				// META EVENT
				
					MIDIFile.tracks[i].events[event].metaFlag = true;
					state = 5;
				break;
				}
				
				var runningStatusFlag = false;
				
				//console.log(temp&0xF0);
				switch (temp & 0xF0)
				{
					case event_noteOff:
					case event_noteOn:
					case event_noteAftertouch:
					case event_controller:
					case event_programChange:
					case event_channelAftertouch:
					case event_pitchBend:
					// New Event Type
				
						MIDIFile.tracks[i].events[event].metaFlag = false;
						MIDIFile.tracks[i].events[event].eventType = temp & 0xF0;
						MIDIFile.tracks[i].events[event].MIDIChannel = temp & 0x0F;
						runningStatus = temp & 0xF0;
						runningStatusChannel = temp & 0x0F;
						
						state = 3;
					
					break;
					
					default:
						// Running status events
						MIDIFile.tracks[i].events[event].metaFlag = false;
						MIDIFile.tracks[i].events[event].eventType = runningStatus;
						MIDIFile.tracks[i].events[event].MIDIChannel = runningStatusChannel;
						
						runningStatusFlag = true;
						
						state = 3;
				
					break;
				
				}
				
				
				if (runningStatusFlag == false)
				{ // If its a running status, flow through, else get a new piece of data for the state machine
					break;
				}
				
				
				case 3:
				// Read Param 1
				MIDIFile.tracks[i].events[event].param1 = temp;
				
				if ((MIDIFile.tracks[i].events[event].eventType == event_programChange)||(MIDIFile.tracks[i].events[event].eventType == event_channelAftertouch))
				{
					state = 0;
					event++;
				}
				else
				{
					state = 4;
				}
				break;
		
				case 4:
				// Read Param 2
				MIDIFile.tracks[i].events[event].param2 = temp;
				state = 0;
				event++;
				//alert("reached the end of an event");
				break;
				
				case 5:
				// Meta event type
				MIDIFile.tracks[i].events[event].eventType = temp;
				MIDIFile.tracks[i].events[event].metalength = 0;
				state = 6;
				break;
				
				
				case 6:
				// variable length meta tag value
				MIDIFile.tracks[i].events[event].metalength += temp & 0x7F;
				if ((temp & 0x80 ) != 0x80)
				{
				//alert("End of variable length");
					
					MIDIFile.tracks[i].events[event].metaLengthCounter = MIDIFile.tracks[i].events[event].metalength ;
					
					switch (MIDIFile.tracks[i].events[event].eventType)
					{
					// text events
					case meta_textEvent:
					case meta_copyrightNotice:
					case meta_sequenceName:
					case meta_instrumentName:
					case meta_lyrics:
					case meta_marker:
					case meta_cuePoint:
					case meta_programName:
					case meta_deviceName:
					case meta_sequenceSpecific:
					case meta_unknown0A:
					case meta_unknown0B:
					case meta_unknown0C:
					MIDIFile.tracks[i].events[event].param1 = '';
					state = 7;
					break;
					
					case meta_sequenceNumber:
					case meta_MIDIChannelPrefix:
					case meta_setTempo:
					case meta_SMPTEOffset:
					case meta_timeSignature:
					case meta_keySignature:
					
					
					
					state = 8;
					break;
					}
				}
				
				break;
				
				
				case 7:
				
				
				
				if (MIDIFile.tracks[i].events[event].metaLengthCounter > 0)
				{
					MIDIFile.tracks[i].events[event].param1 += String.fromCharCode(temp);
					MIDIFile.tracks[i].events[event].metaLengthCounter--;
				
					if (MIDIFile.tracks[i].events[event].metaLengthCounter == 0)
					{
					state = 0;
					event++;
					}
				}
		
				
				
				break;
				
				
				
				case 8:
				MIDIFile.tracks[i].events[event].param1 = temp;
				
				
				
				state = 9;
				break;
				
				case 9:
				MIDIFile.tracks[i].events[event].param2 = temp;
				
				
				if (MIDIFile.tracks[i].events[event].eventType == meta_timeSignature)
				{
				state = 10;
				}
				else
				{
				state = 0;
				event++;
				}
				break;
				
				
				case 10:
				MIDIFile.tracks[i].events[event].param3 = temp;
				state = 11;
				
				break;
				
				case 11:
				MIDIFile.tracks[i].events[event].param4 = temp;
				state = 0;
				event++;
				
				break;
				
				}
		//fileloc++;
		}
		MIDIFile.tracks[i].eventCount = event;	
	
		/*
		var eventDataEnd = parseInt(MIDIFile.tracks[i].chunkSize,10) + fileloc;
		var j = 0;
		
		
		while (fileloc < eventDataEnd)
		{
	
			MIDIFile.tracks[i].events[j] = new Object();
			// read the variable length of the delta time
			// keep reading bytes until you encounter a MSB of 0
			//
			var deltasum = 0;
			var deltatime = 0;
			
			var x = 0;
			
			do 
			{
				deltatime = read1ByteNumber(file);
				deltasum = deltasum + ( deltatime & 0x7F);
				x++;
			}
			while ((deltatime & 0x80 ) == 1);
			
			//alert(x);
			
			MIDIFile.tracks[i].events[j].deltaTime = deltasum;
			
			
			//MIDIFile.tracks[i].events[j].deltaTime = read1ByteNumber(file);
			
			var eventtype = read1ByteNumber(file);
			
			MIDIFile.tracks[i].events[j].eventType = eventtype & 0xF0;
			MIDIFile.tracks[i].events[j].MIDIChannel = eventtype & 0x0F;
			
			MIDIFile.tracks[i].events[j].param1 = read1ByteNumber(file);
			MIDIFile.tracks[i].events[j].param2 = read1ByteNumber(file);
			
			
			//alert(');
			
			//document.getElementById("output4").innerHTML += 'Added event: '+MIDIFile.tracks[i].events[j].deltaTime+' '+
			//MIDIFile.tracks[i].events[j].eventType+' '+MIDIFile.tracks[i].events[j].MIDIChannel+' '+
			//MIDIFile.tracks[i].events[j].param1+' '+MIDIFile.tracks[i].events[j].param2;
			
			j++;
		}
	*/
	}
}

function writeHeader()
{
var output;
output = 
"Filelocation Start: "+MIDIFile.filelocation+"<br>"+
"ChunkID: "+MIDIFile.chunkID+"<br>"+
"Chunk Size: "+MIDIFile.chunkSize+"<br>"+
"Format Type: "+MIDIFile.formatType+"<br>"+
"Track Count: "+MIDIFile.trackNum+"<br>"+
"Time Division Type: "+MIDIFile.timeDivisionType+"<br>"+
"Ticks per Beat: "+MIDIFile.timeDivision+"<br>"+
"Frames per Second: "+MIDIFile.framesPerSecond+"<br>"+
"Ticks per Frame: "+MIDIFile.ticksPerFrame+"<br>"
;

return output;
}

function parseEventType(meta, eventtype)
{
	if (meta == true)
	{
		return metaEventTypes[eventtype];
	}
	else
	{
		return channelEventTypes[eventtype];
	}
}

function writeTracks()
{
var output;
output = "";
var i = 0;
for (i=0; i<MIDIFile.trackNum; i++)
{
	output = output + 
	"--------<br>" +
	"Filelocation Start: "+MIDIFile.tracks[i].filelocation+"<br>"+
	"ChunkID: "+MIDIFile.tracks[i].chunkID+"<br>"+
	"Track Size: "+MIDIFile.tracks[i].chunkSize+"<br>"+
	"Event Count: "+MIDIFile.tracks[i].eventCount+"<br>";	

	for(var j=0; j<=MIDIFile.tracks[i].eventCount; j++)
	{
		output +=
		"---["+j+"]---<br>"+
		"Meta Event Flag: "+MIDIFile.tracks[i].events[j].metaFlag+"<br>"+
		"Meta Field Length: "+MIDIFile.tracks[i].events[j].metalength+"<br>"+
		"Event Type: "+parseEventType(MIDIFile.tracks[i].events[j].metaFlag, MIDIFile.tracks[i].events[j].eventType)+"<br>"+
		"MIDI Channel: "+MIDIFile.tracks[i].events[j].MIDIChannel+"<br>"+
		"Delta Time: "+MIDIFile.tracks[i].events[j].deltaTime+"<br>";
		
		
		var params = '';
		
		if (MIDIFile.tracks[i].events[j].metaFlag == false)
		{
			switch ( MIDIFile.tracks[i].events[j].eventType )
			{
			case event_noteOff:
			case event_noteOn:
			params = 
			"Note: "+MIDIFile.tracks[i].events[j].param1+"<br>"+
			"Volume: "+MIDIFile.tracks[i].events[j].param2+"<br>";
			break;
			
			case event_noteAftertouch:
			params = 
			"Note: "+MIDIFile.tracks[i].events[j].param1+"<br>"+
			"Amount: "+MIDIFile.tracks[i].events[j].param2+"<br>";
			break;
			case event_controller:
			params = 
			"Controller Type: "+MIDIFile.tracks[i].events[j].param1+"<br>"+
			"Value "+MIDIFile.tracks[i].events[j].param2+"<br>";
			break;
			case event_programChange:
			params = 
			"Program Number: "+MIDIFile.tracks[i].events[j].param1+"<br>";
			break;
			case event_channelAftertouch:
			params = 
			"Amount: "+MIDIFile.tracks[i].events[j].param1+"<br>";
			break;
			
			case event_pitchBend:
			params = 
			"Value(LSB): "+MIDIFile.tracks[i].events[j].param1+"<br>"+
			"Value(MSB): "+MIDIFile.tracks[i].events[j].param2+"<br>"
			break;
			}
		}
		else
		{	
		params = 
		"Param 1: "+MIDIFile.tracks[i].events[j].param1+"<br>"+
		"Param 2: "+MIDIFile.tracks[i].events[j].param2+"<br>"+
		"Param 3: "+MIDIFile.tracks[i].events[j].param3+"<br>"+
		"Param 4: "+MIDIFile.tracks[i].events[j].param4+"<br>";
		
		}
		
		
		output += params;
		
	
	}

}

return output;
}



function read4ByteCharacters(file)
{
	var output = file.slice(fileloc, fileloc+4);
	fileloc = fileloc + 4;
	return output;
}

function read4ByteNumber(file)
{
	var output = file.charCodeAt(fileloc)*(256*256*256) + file.charCodeAt(fileloc+1)*(256*256) + file.charCodeAt(fileloc+2)*(256) + file.charCodeAt(fileloc+3)*(1);
	fileloc = fileloc + 4;
	return output;
}

function read2ByteNumber(file)
{
	var output = file.charCodeAt(fileloc)*(256) + file.charCodeAt(fileloc+1)*(1);
	fileloc = fileloc + 2;
	return output;
}

function read1ByteNumber(file)
{
	var output = file.charCodeAt(fileloc)*(1);
	fileloc = fileloc + 1;
	return output;
}
