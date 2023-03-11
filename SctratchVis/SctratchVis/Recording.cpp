#include "Recording.h"

Recording::Recording()
{
	init();
}

void Recording::clean()
{
	FMOD_RESULT res;
	mIsRecording = false;
	mIsPlaying = false;

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

	// releas esound
	if (mpRecSound)
	{
		res = mpRecSound->release();
		FMODErrorCheck(res, "release recording sound in clean()");
	}

	// release channel group
	if (mpRecCGroup)
	{
		res = mpRecCGroup->release();
		FMODErrorCheck(res, "release channel group in clean()");
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
	mpRecChannel = NULL;

	mSamplesRecorded = 0;
	mSamplesPlayed = 0;
	mRecFreq = 0;

	mIsRecording = false;
	mIsPlaying = false;

	mExtraDriverData = NULL;

	// create system objet and initialize
	mpRecSystem = NULL;
	res = FMOD::System_Create(&mpRecSystem);
	FMODErrorCheck(res, "creating system in Recording::init()");

	// get system version
	mVersion = 0;
	res = mpRecSystem->getVersion(&mVersion);
	FMODErrorCheck(res, "getting system version in Recording::init()");

	if (mVersion < FMOD_VERSION)
		std::cout << "FMOD lib version " << mVersion << "doesn't match header version " << FMOD_VERSION << std::endl;

	// initialize system
	res = mpRecSystem->init(32, FMOD_INIT_NORMAL, mExtraDriverData);
	FMODErrorCheck(res, "initialize system in Recording::init()");

	mNumDrivers = 0;
	// check input devices
	//res = mpRecSystem->getRecordNumDrivers(&mRecordingSources, &mNumDrivers);
	res = mpRecSystem->getRecordNumDrivers(&mNumDrivers, &mRecordingSources);
	FMODErrorCheck(res, "get num record drivers in Recording::init()");

	for (int i = 0; i < mRecordingSources; i++)
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

		if (mRecordDriver > mRecordingSources)
		{
			std::cout << "Invalid selection, please try again";
			mRecordDriver = -1;
		}
	}

	char devName[256];
	res = mpRecSystem->getRecordDriverInfo(mRecordDriver, devName, 256, NULL, &mNativeRate, NULL, &mNativeChannels, NULL);
	FMODErrorCheck(res, "retrieve info from specified recording device in Recording class constructor");
	std::cout << "Recording from device " << devName << std::endl;
	std::cout << "mNativeRate: " << mNativeRate << std::endl;
	std::cout << "mNativeChannels: " << mNativeChannels << std::endl;

	exinfo.cbsize = sizeof(FMOD_CREATESOUNDEXINFO);
	exinfo.numchannels = mNativeChannels;
	exinfo.format = FMOD_SOUND_FORMAT_PCM16;
	exinfo.defaultfrequency = mNativeRate;
	exinfo.length = mNativeRate * mNativeChannels * sizeof(short) * 5;

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
	FMODErrorCheck(res, "create channel group in init()");

	// add DSP to channel group
	res = mpRecCGroup->addDSP(FMOD_CHANNELCONTROL_DSP_TAIL, mpRecDSP);
	FMODErrorCheck(res, "add dsp to channel group in init()");
}

void Recording::playRecording()
{
	FMOD_RESULT res;

	// play back recording
	res = mpRecSystem->playSound(mpRecSound, 0, false, &mpRecChannel);
	FMODErrorCheck(res, "play back recording in Recording::playRecording()");
}

void Recording::processRecording()
{
	FMOD_RESULT res;

	void* buffer;
	unsigned int length;

	// lock sound
	res = mpRecSound->lock(0, 256, &buffer, nullptr, &length, 0);
	FMODErrorCheck(res, "lock sound in Recording::processRecording()");
	if (res == FMOD_OK)
	{
		float freq;

		res = mpRecDSP->getParameterFloat(FMOD_DSP_FFT_DOMINANT_FREQ, &freq, 0, 0);
		FMODErrorCheck(res, "get dominant freq in Recording::processRecording()");

		void* specData;
		res = mpRecDSP->getParameterData((int)FMOD_DSP_FFT_SPECTRUMDATA, (void**)&specData, 0, 0, 0);
		FMODErrorCheck(res, "get spectrum data in Recording::processRecording()");

		FMOD_DSP_PARAMETER_FFT* fft = (FMOD_DSP_PARAMETER_FFT*)specData;
		if (fft)
			*mRecSpec = (float&)fft->spectrum;

		freq /= 10000;
		mRecFreq = freq;
	}
	// process audio data here
	res = mpRecSound->unlock(buffer, NULL, length, 0);
	FMODErrorCheck(res, "unlock audio data in Recording::processRecording()");
}

void Recording::startCapture()
{
	FMOD_RESULT res;

	// create sound
	res = mpRecSystem->createSound(0, FMOD_LOOP_NORMAL | FMOD_OPENUSER, &exinfo, &mpRecSound);
	FMODErrorCheck(res, "create sound in Recording::starCapture()");

	// start recording
	res = mpRecSystem->recordStart(mRecordDriver, mpRecSound, true);
	FMODErrorCheck(res, "start recording in Recording::startCapture()");

	// check if it is recording
	res = mpRecSystem->isRecording(0, &mIsRecording);
	FMODErrorCheck(res, "check if recording in Recording::startCapture()");

	// stop pause
	//res = mpRecChannel->setPaused(true);
	//FMODErrorCheck(res, "Stop recording in Recording::startCapture()");

	// check if it is recording
	res = mpRecSystem->isRecording(mRecordDriver, &mIsRecording);
	FMODErrorCheck(res, "check if recording in Recording::startCapture()");
}

void Recording::stopCapture()
{
	mpRecChannel->stop();

	mpRecSystem->recordStop(mRecordDriver);
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

/*bool Recording::update()
{
	FMOD_RESULT res;

	res = mpRecSystem->update();
	FMODErrorCheck(res, "update system in update()");

	//if (mIsRecording)
	{
		startCapture();
		processRecording();
		playRecording();
	}

	mpRecChannel->isPlaying(&mIsPlaying);

	return mIsPlaying;
}
*/

bool Recording::update()
{
	FMOD_RESULT res;
	FMOD::Channel* pChannel = NULL;
	
	unsigned int samplesRecorded = 0;
	unsigned int samplesPlayed = 0;
	bool dspEnabled = false;

	void* extraDriverData = NULL;

	// create system object and init
	FMOD::System* pSys = NULL;
	res = FMOD::System_Create(&pSys);
	FMODErrorCheck(res, "create system in Recording::update()");

	unsigned int version = 0;
	res = pSys->getVersion(&version);
	FMODErrorCheck(res, "get version in Recording::update()");

	res = pSys->init(100, FMOD_INIT_NORMAL, extraDriverData);
	FMODErrorCheck(res, "sys init in Recording::update()");

	int numDrivers = 0;
	res = pSys->getRecordNumDrivers(NULL, &numDrivers);
	FMODErrorCheck(res, "get num drivers in Recording::update()");

	// determine latency in samples
	int nativeRate = 0;
	int nativeChannels = 0;
	res = pSys->getRecordDriverInfo(DEVICE_INDEX, NULL, 0, NULL, &nativeRate, NULL, &nativeChannels, NULL);
	FMODErrorCheck(res, "get driver info in Recording::update()");

	unsigned int driftThreshold = (nativeRate * DRIFT_MS) / 1000; // where to start compensating for drift
	unsigned int desiredLatency = (nativeRate * LATENCY_MS) / 1000; // user specified latency
	unsigned int adjustedLatency = desiredLatency; // user spec adjusted for driver update granularity
	int actualLatency = desiredLatency; // latency measured once playback begins (smoothend for jitter)

	// create user sound to record into, then start recording
	exinfo = { 0 };
	exinfo.cbsize = sizeof(FMOD_CREATESOUNDEXINFO);
	exinfo.numchannels = nativeChannels;
	exinfo.format = FMOD_SOUND_FORMAT_PCM16;
	exinfo.defaultfrequency = nativeRate;
	exinfo.length = nativeRate * sizeof(short) * nativeChannels; // 1 second buffer, size here doesnt change latency

	FMOD::Sound *pSound = NULL;
	res = pSys->createSound(0, FMOD_LOOP_NORMAL | FMOD_OPENUSER, &exinfo, &pSound);
	FMODErrorCheck(res, "create sound in Recording::update()");

	res = pSys->recordStart(DEVICE_INDEX, pSound, true);
	FMODErrorCheck(res, "start recording in Recording::update()");

	unsigned int soundLength = 0;
	res = pSound->getLength(&soundLength, FMOD_TIMEUNIT_PCM);
	FMODErrorCheck(res, "get sound length in Recording::update()");

	// main loop
	do
	{
		pSys->update();

		// determine how much has been recorded since last check
		unsigned int recPos = 0;
		res = pSys->getRecordPosition(DEVICE_INDEX, &recPos);
		FMODErrorCheck(res, "check recording position in Recording::update()");

		static unsigned int lastRecordPos = 0;
		unsigned int recDelta = (recPos >= lastRecordPos) ? (recPos - lastRecordPos) : (recPos + soundLength - lastRecordPos);
		lastRecordPos = recPos;
		samplesRecorded += recDelta;

		static unsigned int minRecDelta = (unsigned int)-1;
		if (recDelta && (recDelta < minRecDelta))
		{
			minRecDelta = recDelta; // smallest driver granularity seen so far
			adjustedLatency = (recDelta <= desiredLatency) ? desiredLatency : recDelta; // adjust latency if driver granularity is high
		}

		// delay playback until desiered latency is reached
		if (!pChannel && samplesRecorded >= adjustedLatency)
		{
			res = pSys->playSound(pSound, 0, false, &pChannel);
			FMODErrorCheck(res, "play sound in Recording::update()");
		}

		if (pChannel)
		{
			// stop playback if recording stops
			bool isRecording = false;
			res = pSys->isRecording(DEVICE_INDEX, &isRecording);
			FMODErrorCheck(res, "check is recording in Recording::updagte()");

			if (!isRecording)
			{
				res = pChannel->setPaused(true);
				FMODErrorCheck(res, "set channel paused in Recording::update()");
			}

			// determine how much has been played since we last checked
			unsigned int playPos = 0;
			res = pChannel->getPosition(&playPos, FMOD_TIMEUNIT_PCM);
			FMODErrorCheck(res, "check play pos in Recording::update()");

			static unsigned int lastPlayPos = 0;
			unsigned int playDelt = (playPos >= lastPlayPos) ? (playPos - lastPlayPos) : (playPos + soundLength - lastPlayPos);
			lastPlayPos = playPos;
			samplesPlayed += playDelt;

			// compensate for any drift
			int latency = samplesRecorded - samplesPlayed;
			actualLatency = (int)((0.97f * actualLatency) + (0.03f * latency));

			int playbackRate = nativeRate;
			if (actualLatency < (int)(adjustedLatency - driftThreshold))
			{
				// play pos is catching up to record pos, slow playback
				playbackRate = nativeRate - (nativeRate / 50);
			}
			else if (actualLatency > (int)(adjustedLatency + driftThreshold))
			{
				// play pos is falling behind record pos, speed playback
				playbackRate = nativeRate + (nativeRate / 50);
			}

			res = pChannel->setFrequency((float)playbackRate);
			FMODErrorCheck(res, "set channel frequency in Recording::update()");
		}
	} while (1);
}

Recording::~Recording()
{
	this->clean();
}