#pragma once

#include "Audio/Audio.h"
#include <queue>>

//#include "../SDKs/FMOD/FMOD Studio API Windows/api/fsbank/inc/fsbank_errors.h"
//#include "../SDKs/FMOD/FMOD Studio API Windows/api/fsbank/inc/fsbank.h"
//#include "../SDKs/FMOD/FMOD Studio API Windows/api/studio/inc/fmod_studio.h"

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

	FMOD::System* mpFmod;
	FMOD::Sound* mpRecSound;
	FMOD::Channel* mpRecChannel;

	// sound card recording source
	int mRecordDriver;
	// number of recording sources available  
	int mRecordingSources;
	int mNumDrivers;

	// create sound buffer
	void createSoundBuffer();

	// start/stop recording from sound card
	void startCapture();
	void stopCapture();

	// FFT sample size
	int mSampleSize;

	// beat detection params
	float mBeatThresholdVolume;
	int mBeatThresholdBar;
	unsigned int mBeatSustain;
	unsigned int mBeatPostIgnore;

	int mBeatLastTick;
	int mBeatIgnoreLastTick;

	// list of how many ms ago the last beats were
	std::queue<int> mBeatTimes;
	unsigned int mBeatTrackCutoff;

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

	void update();
};
