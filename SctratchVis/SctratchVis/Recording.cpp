#include "Recording.h"

Recording::Recording()
{
	mSampleSize = 64;

	mBeatThresholdVolume = 0.4f;
	mBeatThresholdBar = 0;
	mBeatSustain = 100;
	mBeatPostIgnore = 300;
	mBeatTrackCutoff = 10000;

	mBeatLastTick = 0;
	mBeatIgnoreLastTick = 0;
	mMusicStartTick = 0;

	mNumDrivers = mpFmod->getNumDrivers(&mNumDrivers);

	mpFmod->getRecordNumDrivers(&mRecordingSources, &mNumDrivers);

	startCapture();
}

void Recording::clean()
{

}

void Recording::startCapture()
{
	// create sound recording buffer
	createSoundBuffer();

	// wait so something is recording
	Sleep(60);

	// start playing recorded sound back, silently, so we can
	// use its channel to get the FFT data. The frequency analysis
	// volume is adjusted so it doesn't matter what we are playing back
	mpFmod->recordStart(mRecordDriver, mpRecSound, true);
	mpRecChannel->setVolume(0);

	//reset beat detection data
	mMusicStartTick = GetTickCount64();
	mBeatTimes.empty();
}

void Recording::stopCapture()
{
	mpRecChannel->stop();

	mpFmod->recordStop(mRecordDriver);

	mpRecSound->release();
	mpRecSound = NULL;
}

void Recording::createSoundBuffer()
{
	// releases previous buffer if there is one
	if (mpRecSound != NULL)
		mpRecSound->release();

	FMOD_CREATESOUNDEXINFO soundInfo;

	memset(&soundInfo, 0, sizeof(FMOD_CREATESOUNDEXINFO));

	soundInfo.cbsize = sizeof(FMOD_CREATESOUNDEXINFO);

	// length of entire sample in bytes, calculated as
	// sample rate * num channels * bits per sample per channel * seconds
	soundInfo.length = SAMPLE_RATE * CHANNELS * sizeof(unsigned short) * 0.5;

	// number of channels and sample rate
	soundInfo.numchannels = CHANNELS;
	soundInfo.defaultfrequency = SAMPLE_RATE;

	// sound format
	soundInfo.format = FMOD_SOUND_FORMAT_PCM16;

	mpFmod->createSound(0, FMOD_LOOP_NORMAL | FMOD_OPENUSER, &soundInfo, &mpRecSound);
}

void Recording::update()
{
	mpFmod->update();
}

Recording::~Recording()
{
	clean();
}