#include <iostream>
#include <map>
#include "Event.h"
#include "CircularQueue.h"


class EventManager
{
private:
	void clean();

	CircularQueue<Event*>* mEvents;

public:
	explicit EventManager(unsigned int size = 64);
	~EventManager();

	void addEvent(Event *pEvent);
	void processEvents();

};