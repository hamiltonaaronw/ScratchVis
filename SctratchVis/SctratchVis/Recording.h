#pragma once

#include "Audio/Audio.h"
#include <queue>>

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

	FMOD::System* mpRecSystem;
	FMOD::Sound* mpRecSound;
	FMOD::Channel* mpRecChannel;

	void* mExtraDriverData;

	bool mDspEnabled;

	unsigned int mSamplesRecorded;
	unsigned int mSamplesPlayed;
	unsigned int mVersion;

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
