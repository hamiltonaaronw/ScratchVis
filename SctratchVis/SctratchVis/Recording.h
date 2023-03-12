#pragma once

#include "Audio/Audio.h"
#include <queue>

//#include "../SDKs/FMOD/FMOD Studio API Windows/api/fsbank/inc/fsbank_errors.h"
//#include "../SDKs/FMOD/FMOD Studio API Windows/api/fsbank/inc/fsbank.h"
//#include "../SDKs/FMOD/FMOD Studio API Windows/api/studio/inc/fmod_studio.h"

#define LATENCY_MS		(50)
#define DRIFT_MS		(1)
#define DEVICE_INDEX	(0)

enum class RecordingState
{
	REC_SELECTION,
	REC_RECORD,
	REC_PLAYBACK,
	REC_QUIT
};

class Recording : public Audio
{
private:
	
	FMOD::Channel		*mpRecChannel;
	FMOD::ChannelGroup	*mpRecCGroup;
	FMOD::DSP			*mpRecDSP;
	FMOD::Sound			*mpRecSound;
	FMOD::System		*mpRecSystem;

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

	float mRecFreq;
	float mRecSpec[256];

	FMOD_CREATESOUNDEXINFO exinfo { 0 };

	// initialize everything
	void init();
	void processAudio();

	// when music was last unpaused
	int mMusicStartTick;

	void clean();

public:
	Recording();
	~Recording();

	// sample rate
	static int const SAMPLE_RATE = 44100;
	// number of channels to sample
	static int const CHANNELS = 2;

	virtual void playSong();
	virtual void togglePause();
	virtual void toggleSong(int prevNext) {};
	virtual bool update();

	virtual int getSpecSize() { return SPEC_SIZE; };
	virtual float getFreq() { return mRecFreq; };
	virtual float* getSpectrumData() { return mRecSpec; };
};
