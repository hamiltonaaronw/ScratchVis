#include "Recording.h"

Recording::Recording()
{
	init();
}

void Recording::clean()
{
	FMOD_RESULT res;
	mIsRecording = false;

	// release DSP
	if (mpRecDSP)
	{
		//remove DSP from channel
		res = mpRecChannel->removeDSP(mpRecDSP);
		FMODErrorCheck(res, "remove dsp in clean()");

		// release DSP
		res = mpRecDSP->release();
		FMODErrorCheck(res, "release dsp in clean()");
	}

	// stop playing, release channel
	if (mpRecChannel)
	{
		res = mpRecChannel->stop();
		FMODErrorCheck(res, "stop channel in clean()");
	}

	// release sound
	if (mpRecSound)
	{
		res = mpRecSound->release();
		FMODErrorCheck(res, "release recording sound in clean()");
	}

	// release channel group
	if (mpRecCGroup)
	{
		//res = FMOD_ChannelGroup_Release(mpCGroup);
		res = mpRecCGroup->release();
		FMODErrorCheck(res, "release channel group in unloadAudio()");
	}

	// release and close system
	if (mpRecSystem)
	{
		// release
		res = mpRecSystem->release();
		FMODErrorCheck(res, "release system in clean()");

		//close
		res = mpRecSystem->close();
		FMODErrorCheck(res, "close system in clean()");
	}
}

void Recording::init()
{
	FMOD_RESULT res;

	mpRecChannel	 = NULL;
	mpRecCGroup		 = NULL;
	mpRecDSP		 = NULL;
	mpRecSound		 = NULL;
	mpRecSystem		 = NULL;
	mExtraDriverData = NULL;

	mActualLatency	= 0;
	mNativeChannels	= 0;
	mNativeRate		= 0;
	mNumDrivers		= 0;
	mRecordDriver	= 0;

	mAdjustedLatency = 0;
	mDesiredLatency	 = 0;
	mDriftThreshold	 = 0;
	mSamplesPlayed	 = 0;
	mSamplesRecorded = 0;
	mSoundLen		 = 0;
	mVersion		 = 0;

	mIsPlaying		= false;
	mIsRecording	= false;

	mBaseDrift		= 1.0f;
	mBaseLatency	= 50.0f;
	mRecFreq		= 0.0f;

	// create system object and init
	res = FMOD::System_Create(&mpRecSystem);
	FMODErrorCheck(res, "create system in Recording::update()");

	// get system version
	res = mpRecSystem->getVersion(&mVersion);
	FMODErrorCheck(res, "getting system version in Recording::init()");

	if (mVersion < FMOD_VERSION)
		std::cout << "FMOD lib version " << mVersion << "doesn't match header version " << FMOD_VERSION << std::endl;

	// initialize system
	res = mpRecSystem->init(32, FMOD_INIT_NORMAL, mExtraDriverData);
	FMODErrorCheck(res, "initialize system in Recording::init()");

	// check input devices
	res = mpRecSystem->getRecordNumDrivers(NULL, &mNumDrivers);
	FMODErrorCheck(res, "get num record drivers in Recording::init()");

	for (int i = 0; i < mNumDrivers; i++)
	{
		char devName[256];
		res = mpRecSystem->getRecordDriverInfo(i, devName, 256, 0, 0, 0, 0, 0);
		std::cout << i << ") " << devName << std::endl;
		FMODErrorCheck(res, "output record driver name in Recording::init()");
	}

	mRecordDriver = -1;
	while (mRecordDriver == -1)
	{
		std::cout << "Select input device from list above: ";
		std::cin >> mRecordDriver;

		if (mRecordDriver > mNumDrivers)
		{
			std::cout << "Invalid selection, please try again";
			mRecordDriver = -1;
		}
	}

	char devName[256];
	res = mpRecSystem->getRecordDriverInfo(mRecordDriver, devName, 256, NULL, &mNativeRate, NULL, &mNativeChannels, NULL);
	FMODErrorCheck(res, "retrieve info from specified recording device in Recording class constructor");
	std::cout << "Recording from device " << devName << std::endl;

	mDriftThreshold = (mNativeRate * mBaseDrift) / 1000; // where to start compensating for drift
	mDesiredLatency = (mNativeRate * mBaseLatency) / 1000; // user specified latency
	mAdjustedLatency = mDesiredLatency; // user spec adjusted for driver update granularity
	mActualLatency = mDesiredLatency; // latency measured once playback begins (smoothend for jitter)

	// create iser sound to record into, then start recording
	exinfo = { 0 };
	exinfo.cbsize = sizeof(FMOD_CREATESOUNDEXINFO);
	exinfo.numchannels = mNativeChannels;
	exinfo.format = FMOD_SOUND_FORMAT_PCM16;
	exinfo.defaultfrequency = mNativeRate;
	exinfo.length = mNativeRate * sizeof(short) * mNativeChannels; // 1 second buffer, size here doesnt change latency

	// create sound
	res = mpRecSystem->createSound(0, FMOD_LOOP_NORMAL | FMOD_OPENUSER, &exinfo, &mpRecSound);
	FMODErrorCheck(res, "create sound in Recording::init()");

	// init DSP
	res = mpRecSystem->createDSPByType(FMOD_DSP_TYPE_FFT, &mpRecDSP);
	FMODErrorCheck(res, "init dsp in init()");

	// set window size for DSP
	res = mpRecDSP->setParameterInt((int)FMOD_DSP_FFT_WINDOWSIZE, 256);
	FMODErrorCheck(res, "set dsp window size in init()");

	// set window type for DSP
	res = mpRecDSP->setParameterInt((int)FMOD_DSP_FFT_WINDOWTYPE, (int)FMOD_DSP_FFT_WINDOW_BLACKMANHARRIS);
	FMODErrorCheck(res, "set dsp window type in init()");

	// create channel group
	res = mpRecSystem->createChannelGroup("Channel group", &mpRecCGroup);
	FMODErrorCheck(res, "create channel group in initAudio()");

	// add DSP to channel group
	res = mpRecCGroup->addDSP(FMOD_CHANNELCONTROL_DSP_TAIL, mpRecDSP);
	FMODErrorCheck(res, "add DSP to channel group in Recording::init()");
}

void Recording::playSong()
{
	FMOD_RESULT res;

	// start recording
	res = mpRecSystem->recordStart(mRecordDriver, mpRecSound, true);
	FMODErrorCheck(res, "start recording in Recording::playSong()");

	// get sound length
	res = mpRecSound->getLength(&mSoundLen, FMOD_TIMEUNIT_PCM);
	FMODErrorCheck(res, "get sound length in Recording::playSong()");
}

void Recording::processAudio()
{
	FMOD_RESULT res;
	float freq = 0;
	void* specData;

	// get dominant freq
	res = mpRecDSP->getParameterFloat(FMOD_DSP_FFT_DOMINANT_FREQ, &freq, 0, 0);
	FMODErrorCheck(res, "get dominant freq in Recording::processAudio()");

	// get spectrum
	res = mpRecDSP->getParameterData((int)FMOD_DSP_FFT_SPECTRUMDATA, (void**)&specData, 0, 0, 0);
	FMODErrorCheck(res, "get spectrum data in Recording::processAudio()");

	FMOD_DSP_PARAMETER_FFT* fft = (FMOD_DSP_PARAMETER_FFT*)specData;

	if (fft)
	{
		for (int i = 0; i < fft->length; i++)
			mRecSpec[i] = (float&)fft->spectrum[i];
	}

	freq /= 10000;
	mRecFreq = freq;
}

void Recording::togglePause()
{
	FMOD_RESULT res;

	std::cout << "Is recording (pre-toggle): " << mIsRecording << std::endl;
	
	// check is recording
	res = mpRecSystem->isRecording(mRecordDriver, &mIsRecording);
	FMODErrorCheck(res, "check is recording in Recording::togglePause()");

	// toggle 
	if (mIsRecording)
		res = mpRecSystem->recordStop(mRecordDriver);
	else
		res = mpRecSystem->recordStart(mRecordDriver, mpRecSound, false);
	FMODErrorCheck(res, "toggle puase in Recording::togglePause()");
	
	// check is recording
	res = mpRecSystem->isRecording(mRecordDriver, &mIsRecording);
	FMODErrorCheck(res, "check is recording in Recording::togglePause()");
	
	std::cout << "Is recording (post-toggle): " << mIsRecording << std::endl;
}

bool Recording::update()
{
	FMOD_RESULT res;

	mpRecSystem->update();
	
	// determine how much has been recorded since last check
	unsigned int recPos = 0;
	res = mpRecSystem->getRecordPosition(mRecordDriver, &recPos);
	FMODErrorCheck(res, "check recording position in Recording::update()");
	
	static unsigned int lastRecordPos = 0;
	unsigned int recDelta = (recPos >= lastRecordPos) ? (recPos - lastRecordPos) : (recPos + mSoundLen - lastRecordPos);
	lastRecordPos = recPos;
	mSamplesRecorded += recDelta;
	
	static unsigned int minRecDelta = (unsigned int)-1;
	if (recDelta && (recDelta < minRecDelta))
	{
		minRecDelta = recDelta; // smallest driver granularity seen so far
		mAdjustedLatency = (recDelta <= mDesiredLatency) ? mDesiredLatency : recDelta; // adjust latency if driver granularity is high
	}
	
	// delay playback until desiered latency is reached
	if (!mpRecChannel && mSamplesRecorded >= mAdjustedLatency)
	{
		res = mpRecSystem->playSound(mpRecSound, mpRecCGroup, false, &mpRecChannel);
		FMODErrorCheck(res, "play sound in Recording::update()");
	}
	
	if (mpRecChannel)
	{
		// stop playback if recording stops
		bool isRecording = false;
		res = mpRecSystem->isRecording(mRecordDriver, &isRecording);
		FMODErrorCheck(res, "check is recording in Recording::updagte()");
	
		if (!isRecording)
		{
			res = mpRecChannel->setPaused(true);
			FMODErrorCheck(res, "set channel paused in Recording::update()");
		}
	
		// determine how much has been played since we last checked
		unsigned int playPos = 0;
		res = mpRecChannel->getPosition(&playPos, FMOD_TIMEUNIT_PCM);
		FMODErrorCheck(res, "check play pos in Recording::update()");
	
		static unsigned int lastPlayPos = 0;
		unsigned int playDelt = (playPos >= lastPlayPos) ? (playPos - lastPlayPos) : (playPos + mSoundLen - lastPlayPos);
		lastPlayPos = playPos;
		mSamplesPlayed += playDelt;
	
		// compensate for any drift
		int latency = mSamplesRecorded - mSamplesPlayed;
		mActualLatency = (int)((0.97f * mActualLatency) + (0.03f * latency));
	
		int playbackRate = mNativeRate;
		if (mActualLatency < (int)(mAdjustedLatency - mDriftThreshold))
		{
			// play pos is catching up to record pos, slow playback
			playbackRate = mNativeRate - (mNativeRate / 50);
		}
		else if (mActualLatency > (int)(mAdjustedLatency + mDriftThreshold))
		{
			// play pos is falling behind record pos, speed playback
			playbackRate = mNativeRate + (mNativeRate / 50);
		}

		this->processAudio();
	
		res = mpRecChannel->setFrequency((float)playbackRate);
		FMODErrorCheck(res, "set channel frequency in Recording::update()");
	}

	// check is playing
	res = mpRecCGroup->isPlaying(&mIsPlaying);
	FMODErrorCheck(res, "check is playing in Recording::update()");

	return mIsPlaying;
}

Recording::~Recording()
{
	this->clean();
}