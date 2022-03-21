#include "Recording.h"

Recording::Recording()
{
	FMOD_RESULT res;
	mpRecChannel = NULL;
	mSamplesRecorded = 0;
	mSamplesPlayed = 0;
	mDspEnabled = false;

	mExtraDriverData = NULL;
	
	// create system objet and initialize
	mpRecSystem = NULL;
	res = FMOD::System_Create(&mpRecSystem);
	FMODErrorCheck(res, "Recording::Recording()");

	mVersion = 0;
	res = mpRecSystem->getVersion(&mVersion);
	FMODErrorCheck(res, "Recording::Recording()");

	if (mVersion < FMOD_VERSION)
		std::cout << "FMOD lib version " << mVersion << "doesn't match header version " << FMOD_VERSION << std::endl;

	res = mpRecSystem->init(100, FMOD_INIT_NORMAL, mExtraDriverData);
	FMODErrorCheck(res, "Record::Record()");

	mNumDrivers = 0;
	res = mpRecSystem->getRecordNumDrivers(NULL, &mNumDrivers);
	FMODErrorCheck(res, "Record::Record()");

	if (mNumDrivers = 0)
		std::cout << "No recording devices found/plugged in!" << std::endl;

}

void Recording::clean()
{
	FMOD_RESULT res;

	res = mpRecSound->release();
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
	mpRecSystem->recordStart(mRecordDriver, mpRecSound, true);
	mpRecChannel->setVolume(0);

	//reset beat detection data
	//mMusicStartTick = GetTickCount64();
	//mBeatTimes.empty();
}

void Recording::stopCapture()
{
	mpRecChannel->stop();

	mpRecSystem->recordStop(mRecordDriver);

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

	mpRecSystem->createSound(0, FMOD_LOOP_NORMAL | FMOD_OPENUSER, &soundInfo, &mpRecSound);
}

void Recording::update()
{
	FMOD_RESULT res;

	// Detect latency in samples
	int nativeRate = 0;
	int nativeChannels = 0;

	res = mpRecSystem->getRecordDriverInfo(DEVICE_INDEX, NULL, 0, NULL, &nativeRate, NULL, &nativeChannels, NULL);
	FMODErrorCheck(res, "Recording::Update()");

	// The point where we start compensating for drift 
	unsigned int driftThreshold = (nativeRate * DRIFT_MS) / 1000;
	// User specified latency 
	unsigned int desiredLatency = (nativeRate * LATENCY_MS) / 1000;
	// User specified latency adjusted for driver update granularity     
	unsigned int adjustedLatency = desiredLatency;
	// Latency measured once playback begins (smoothened for jitter)                              
	int actualLatency = desiredLatency;

	// create user sound to record into, then start recording
	FMOD_CREATESOUNDEXINFO exinfo = { 0 };
	exinfo.cbsize = sizeof(FMOD_CREATESOUNDEXINFO);
	exinfo.numchannels = nativeChannels;
	exinfo.format = FMOD_SOUND_FORMAT_PCM16;
	exinfo.defaultfrequency = nativeRate;
	// 1 second buffer, size here doesn't change latency
	exinfo.length = nativeRate * sizeof(short) * nativeChannels;

	FMOD::Sound* pSound = NULL;
	res = mpRecSystem->createSound(0, FMOD_LOOP_NORMAL | FMOD_OPENUSER, &exinfo, &pSound);
	FMODErrorCheck(res, "Record::Update()");

	res = mpRecSystem->recordStart(DEVICE_INDEX, pSound, true);
	FMODErrorCheck(res, "Record::Update()");

	unsigned int soundLength = 0;
	res = pSound->getLength(&soundLength, FMOD_TIMEUNIT_PCM);
	FMODErrorCheck(res, "Record::Update()");

	// main loop
	do
	{
		res = mpRecSystem->update();
		FMODErrorCheck(res, "Record::Update()");

		// determine how much has been recorded since last check
		unsigned int recordPos = 0;
		res = mpRecSystem->getRecordPosition(DEVICE_INDEX, &recordPos);
		
		if (res != FMOD_ERR_RECORD_DISCONNECTED)
			FMODErrorCheck(res, "Record::Update()");

		static unsigned int lastRecPos = 0;
		unsigned int recordDelta = (recordPos >= lastRecPos) ? (recordPos - lastRecPos) : (recordPos + soundLength - lastRecPos);
		lastRecPos = recordPos;
		mSamplesRecorded += recordDelta;

		static unsigned int minRecordDelta = (unsigned int)-1;
		if (recordDelta && (recordDelta < minRecordDelta))
		{
			// smallest driver granularity seen so far
			minRecordDelta = recordDelta;
			// adjust latency if driver granularity is high
			adjustedLatency = (recordDelta <= desiredLatency) ? desiredLatency : recordDelta; 
		}

		// delay playback until desired latency is reached
		if (!mpRecChannel && mSamplesRecorded >= adjustedLatency)
		{
			res = mpRecSystem->playSound(pSound, 0, false, &mpRecChannel);
			FMODErrorCheck(res, "Record::Update()");
		}

		if (mpRecChannel)
		{
			// stop playback if recording stops
			bool isRecording = false;
			res = mpRecSystem->isRecording(DEVICE_INDEX, &isRecording);
			if (res != FMOD_ERR_RECORD_DISCONNECTED)
				FMODErrorCheck(res, "Record::Update()");

			if (!isRecording)
			{
				res = mpRecChannel->setPaused(true);
				FMODErrorCheck(res, "Record::Update()");
			}

			// determine how much has been played since last check
			unsigned int playPos = 0;
			res = mpRecChannel->getPosition(&playPos, FMOD_TIMEUNIT_PCM);
			FMODErrorCheck(res, "Record::Update()");

			static unsigned int lastPlayPos = 0;
			unsigned int playDelta = (playPos >= lastPlayPos) ? (playPos - lastPlayPos) : (playPos + soundLength - lastPlayPos);
			lastPlayPos = playPos;
			mSamplesPlayed += playDelta;

			// compensate for any drift
			int latency = mSamplesRecorded - mSamplesPlayed;
			actualLatency = (int)((0.97f * actualLatency) + (0.03f * latency));

			int playbackRate = nativeRate;
			if (actualLatency < (int)(adjustedLatency - driftThreshold))
			{
				// play position is catching up to the record position, slow playback down by 2%
				playbackRate = nativeRate - (nativeRate / 50);
			}
			else if (actualLatency > (int)(adjustedLatency + driftThreshold))
			{
				// play position falling behind record position, speed playback up by 2%
				playbackRate = nativeRate + (nativeRate / 50);
			}

			res = mpRecChannel->setFrequency((float)playbackRate);
			FMODErrorCheck(res, "Record::Update()");

		}

	} while (1);
}

Recording::~Recording()
{
	clean();
}