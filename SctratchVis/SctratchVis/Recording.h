#pragma once

#include "Audio/Audio.h"
#include <queue>

class Recording : public Audio
{
private:

	FMOD::Channel* mpRecChannel;
	FMOD::ChannelGroup* mpRecCGroup;
	FMOD::DSP* mpRecDSP;
	FMOD::Sound* mpRecSound;
	FMOD::System* mpRecSystem;

	void* mExtraDriverData;

	const int SPEC_SIZE = 256;

	int mActualLatency;
	int mNativeChannels;
	int mNativeRate;
	int mNumDrivers;
	int mRecordDriver;

	unsigned int mAdjustedLatency;
	unsigned int mDesiredLatency;
	unsigned int mDriftThreshold;

	unsigned int mSamplesPlayed;
	unsigned int mSamplesRecorded;
	unsigned int mSoundLen;
	unsigned int mVersion;

	bool mIsPlaying;
	bool mIsRecording;

	float mBaseDrift;
	float mBaseLatency;
	float mRecFreq;
	float mRecSpecSum;
	float mRecSpec[256];
	float mRecSpec3[3];

	FMOD_CREATESOUNDEXINFO exinfo{ 0 };

	void init();
	void processAudio();
	void clean();

public:
	Recording();
	~Recording();

	virtual void playSong();
	virtual void togglePause();
	virtual bool update();

	virtual int getSpecSize() { return SPEC_SIZE; };
	virtual float getFreq() { return mRecFreq; };
	virtual float getSpecSum() { return mRecSpecSum; };
	virtual float* getSpectrumData() { return mRecSpec; };
	virtual float* getSpectrumData3() { return mRecSpec3; };

	// empty virtual functions
	virtual std::string getCurrentSongName() { return "Recording"; }
	virtual std::string getSongName(int i) { return "Recording"; }
	virtual void setMusicDir(std::string s) {};
	virtual void toggleRand() {};
	virtual void toggleSong(int prevNext) {};
};
