enum EventMessage
{

};

class Event
{
private:

	virtual void process() = 0;

public:
	Event(EventMessage msg);
	~Event();
};
