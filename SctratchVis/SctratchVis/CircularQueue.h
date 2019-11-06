#pragma once

template <class T>
class CircularQueue
{
private:
	T* mArray;
	unsigned int mCapacity;
	unsigned int mBack;
	unsigned int mFront;
	unsigned int mNumEntries;

public:
	explicit CircularQueue(unsigned int size)
		: mCapacity(size),
		mFront(0),
		mBack(0),
		mNumEntries(0)
	{	mArray = new T[size];	}

	~CircularQueue() { delete[] mArray; };

	bool popFront(T& item)
	{
		if (mNumEntries == 0)
			return false;

		item = mArray[mFront];
		mFront++;
		mNumEntries--;

		if (mFront >= mCapacity)
			mFront = 0;

		return true;
	}

	bool pushBack(const T& item)
	{
		if (mNumEntries >= mCapacity)
			return false;

		mArray[mBack] = item;
		mBack++;
		mNumEntries++;

		if (mBack >= mCapacity)
			mBack = 0;

		return true;
	}

	void reset()
	{
		mFront = 0;
		mBack = 0;
		mNumEntries = 0;
	}

	int getNumEntries() { return mNumEntries; };
};
