#include <iostream>
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

	void addEvent(Event *pEvent, int delay);
	void processEvents();

};