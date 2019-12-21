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
	:Event(EventMessage::INPUT_EVENT),
	mType(type)
{}

void InputEvent::process()
{
	switch (mType)
	{
	case InputKey::ESC:
		gpGraphics->close();
		break;

	case InputKey::SPACE_KEY:
		gpGraphics->togglePauseSong_Wrapper();
		break;

	case InputKey::RIGHT:
		gpGraphics->toggleSong_Wrapper(1);
		break;

	case InputKey::LEFT:
		gpGraphics->toggleSong_Wrapper(-1);
		break;

	case InputKey::UP:
		gpGraphics->toggleShader_Wrapper(1);
		break;

	case InputKey::DOWN:
		gpGraphics->toggleShader_Wrapper(-1);
		break;

	case InputKey::Q:
		gpGraphics->toggleRand_Wrapper();
		break;

	case InputKey::R:
		gpGraphics->reloadShader_Wrapper();
		break;

	case InputKey::SHIFT_S:
		gpGraphics->debug_Wrapper(DebugOutputType::LIST_SHADERS, false);
		break;

	case InputKey::SHIFT_A:
		gpGraphics->debug_Wrapper(DebugOutputType::LIST_SONGS, false);
		break;

	case InputKey::SHIFT_Z:
		gpGraphics->debug_Wrapper(DebugOutputType::CURRENT_SHADER, false);
		break;

	case InputKey::SHIFT_X:
		gpGraphics->debug_Wrapper(DebugOutputType::CURRENT_SONG, false);
		break;

	case InputKey::SHIFT_B:
		gpGraphics->reloadAudio_Wrapper(false);
		break;

	case InputKey::TAB_S:
		gpGraphics->debug_Wrapper(DebugOutputType::LIST_SHADERS, true);
		break;

	case InputKey::TAB_A:
		gpGraphics->debug_Wrapper(DebugOutputType::LIST_SONGS, true);
		break;

	case InputKey::TAB_Z:
		gpGraphics->debug_Wrapper(DebugOutputType::CURRENT_SHADER, true);
		break;

	case InputKey::TAB_X:
		gpGraphics->debug_Wrapper(DebugOutputType::CURRENT_SONG, true);
		break;

	case InputKey::TAB_B:
		gpGraphics->reloadAudio_Wrapper(true);
		break;

	default:
		break;
	}
}

InputEvent::~InputEvent()
{}

SongEndEvent::SongEndEvent()
	: Event(EventMessage::SONG_END_EVENT)
{}

void SongEndEvent::process()
{
	std::thread tthread([] {
		gpGraphics->setTime(0.0);
		});

	std::thread sthread([] {
		gpGraphics->toggleSong_Wrapper(1);
		});

	tthread.join();
	sthread.join();
}

SongEndEvent::~SongEndEvent()
{}