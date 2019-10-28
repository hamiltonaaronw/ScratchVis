#include "Event.h"

Event::Event(EventMessage msg)
	:mType(msg),
	mSubmittedTime(0),
	mScheduledTime(0)
{
}

Event::~Event()
{

}

// Input Events
InputEvent::InputEvent(InputKey type)
	:Event(INPUT_EVENT),
	mType(type)
{}

void InputEvent::process()
{
	switch (mType)
	{
	case ESC:
		gpGraphics->close();
		break;

	case SPACE_KEY:
		gpGraphics->togglePauseSong_Wrapper();
		break;

	case RIGHT:
		gpGraphics->toggleSong_Wrapper(1);
		break;

	case LEFT:
		gpGraphics->toggleSong_Wrapper(-1);
		break;

	case UP:
		gpGraphics->toggleShader_Wrapper(1);
		break;

	case DOWN:
		gpGraphics->toggleShader_Wrapper(-1);
		break;

	case Q:
		gpGraphics->toggleRand_Wrapper();
		break;

	case R:
		gpGraphics->reloadShader_Wrapper();
		break;

	case T:
		break;

	case SHIFT_S:
		gpGraphics->debug_Wrapper(DebugOutputType::LIST_SHADERS, false);
		break;

	case SHIFT_A:
		gpGraphics->debug_Wrapper(DebugOutputType::LIST_SONGS, false);
		break;

	case SHIFT_Z:
		gpGraphics->debug_Wrapper(DebugOutputType::CURRENT_SHADER, false);
		break;

	case SHIFT_X:
		gpGraphics->debug_Wrapper(DebugOutputType::CURRENT_SONG, false);
		break;

	case SHIFT_B:
		gpGraphics->reloadAudio_Wrapper(false);
		break;

	case TAB_S:
		gpGraphics->debug_Wrapper(DebugOutputType::LIST_SHADERS, true);
		break;

	case TAB_A:
		gpGraphics->debug_Wrapper(DebugOutputType::LIST_SONGS, true);
		break;

	case TAB_Z:
		gpGraphics->debug_Wrapper(DebugOutputType::CURRENT_SHADER, true);
		break;

	case TAB_X:
		gpGraphics->debug_Wrapper(DebugOutputType::CURRENT_SONG, true);
		break;

	case TAB_B:
		gpGraphics->reloadAudio_Wrapper(true);
		break;

	default:
		break;
	}
}

InputEvent::~InputEvent()
{}