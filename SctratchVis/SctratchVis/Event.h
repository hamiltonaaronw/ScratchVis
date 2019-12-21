#pragma once

#include "Graphics.h"

enum class EventMessage
{
	INVALID = -1,
	INPUT_EVENT,
	SONG_END_EVENT,
	DEFAULT
};

class Event
{
private:

	virtual void process() = 0;

public:
	friend class EventManager;

	Event(EventMessage msg);
	~Event();

	float getSubmittedTime() const { return mSubmittedTime; };
	float getScheduledTime() const { return mScheduledTime; };

protected:
	EventMessage mType;
	float mSubmittedTime;
	float mScheduledTime;
};

enum class InputKey
{
	INVALID_KEY = -1,
	ESC,		SPACE_KEY,
	RIGHT,		LEFT,		UP,			DOWN,
	Q,			R,	
	SHIFT_S,	SHIFT_A,	SHIFT_Z,	SHIFT_X,	SHIFT_B,
	TAB_S,		TAB_A,		TAB_Z,		TAB_X,		TAB_B,
};

class InputEvent : public Event
{
private:
	InputKey mType;

public:
	InputEvent(InputKey type);
	~InputEvent();
	void process();
};

class SongEndEvent : public Event
{
private:

public:
	SongEndEvent();
	~SongEndEvent();

	void process();
};
