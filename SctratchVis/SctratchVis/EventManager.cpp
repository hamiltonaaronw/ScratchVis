#include "EventManager.h"

EventManager::EventManager(unsigned int size)
{
	mEvents = new CircularQueue<Event *>(size);
}

void EventManager::addEvent(Event* pEvent, int delay)
{
	float cTime = gpGraphics->getCurTime();

	pEvent->mSubmittedTime = cTime;
	pEvent->mScheduledTime = cTime + delay;

	bool success = mEvents->pushBack(pEvent);
	assert(success);
}

void EventManager::clean()
{
	Event* pEvent;
	while (mEvents->popFront(pEvent))
		delete pEvent;

	delete mEvents;
}

void EventManager::processEvents()
{
	if (mEvents->getNumEntries() == 0)
		return;

	Event* pEvent;

	while (mEvents->popFront(pEvent))
	{
		float cTime = gpGraphics->getCurTime();
		if (pEvent->getScheduledTime() <= cTime)
		{
 			pEvent->process();
			delete pEvent;
		}
		else
			mEvents->pushBack(pEvent);
	}
}

EventManager::~EventManager()
{
	clean();
}