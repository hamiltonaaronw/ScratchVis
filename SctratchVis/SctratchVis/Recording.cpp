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
	FMODErrorCheck(res, "Recording::Recording()");

	mVersion = 0;
	res = mpRecSystem->getVersion(&mVersion);
	FMODErrorCheck(res, "Recording::Recording()");

	if (mVersion < FMOD_VERSION)
		std::cout << "FMOD lib version " << mVersion << "doesn't match header version " << FMOD_VERSION << std::endl;

	res = mpRecSystem->init(100, FMOD_INIT_NORMAL, mExtraDriverData);
	FMODErrorCheck(res, "Record::Record()");

	mNumDrivers = 0;
	// check input devices
	res = mpRecSystem->getRecordNumDrivers(&mRecordingSources, &mNumDrivers);
	FMODErrorCheck(res, "get num record drivers in initAudio()");

	std::cout << "Num Rec drivers: " << mRecordingSources << std::endl;

	for (int i = 0; i < mRecordingSources; i++)
	{
		char devName[256];
		res = mpRecSystem->getRecordDriverInfo(i, devName, 256, 0, 0, 0, 0, 0);
		std::cout << i << ") " << devName << std::endl;
		FMODErrorCheck(res, "output record driver name in initAudio()");
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
	res = mpRecSystem->getRecordDriverInfo(mRecordDriver, devName, 256, 0, 0, 0, 0, 0);
	FMODErrorCheck(res, "retrieve info from specified recording device in Recording class constructor");
	std::cout << "Recording from device " << devName << std::endl;

	exinfo = { 0 };
	exinfo.cbsize = sizeof(FMOD_CREATESOUNDEXINFO);
	exinfo.numchannels = 2;
	exinfo.format = FMOD_SOUND_FORMAT_PCM16;
	exinfo.defaultfrequency = 44100;
	exinfo.length = exinfo.defaultfrequency * sizeof(short) * exinfo.numchannels * 5;
	mpRecSystem->createSound(nullptr, FMOD_LOOP_NORMAL | FMOD_OPENUSER, nullptr, &mpRecSound);

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

void Recording::startCapture()
{
	FMOD_RESULT res;
	mpRecSystem->recordStart(0, mpRecSound, true);
	mpRecSystem->update();
	mpRecSound->getLength(&exinfo.length, FMOD_TIMEUNIT_PCM);

	if (exinfo.length >= exinfo.defaultfrequency * sizeof(short) * exinfo.numchannels * 5)
		mIsRecording = false;

	// stop recording
	res = mpRecSystem->recordStop(0);
	FMODErrorCheck(res, "stop recording in Recording::startCapture()");
	
	//play back recorded audio
	res = mpRecSystem->playSound(mpRecSound, nullptr, false, &mpRecChannel);
	FMODErrorCheck(res, "play back recorded audio in Recording::startCapture()");
}

void Recording::stopCapture()
{
	mpRecChannel->stop();

	mpRecSystem->recordStop(0);
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
	//soundInfo.length = SAMPLE_RATE * CHANNELS * sizeof(unsigned short) * 0.5;
	soundInfo.length = SAMPLE_RATE * CHANNELS * sizeof(unsigned short) / 2;

	// number of channels and sample rate
	soundInfo.numchannels = CHANNELS;
	soundInfo.defaultfrequency = SAMPLE_RATE;

	// sound format
	soundInfo.format = FMOD_SOUND_FORMAT_PCM16;

	mpRecSystem->createSound(0, FMOD_LOOP_NORMAL | FMOD_OPENUSER, &soundInfo, &mpRecSound);
}

void Recording::playSong()
{
	std::cout << "Recording::playSong()" << std::endl;
}

void Recording::togglePause()
{
	std::cout << "Recording::togglePause()" << std::endl;
}

bool Recording::update()
{
	FMOD_RESULT res;
	float freq = 0;
	std::cout << "Recording::update()" << std::endl;

	startCapture();

	res = mpRecDSP->getParameterFloat(FMOD_DSP_FFT_DOMINANT_FREQ, &freq, 0, 0);
	FMODErrorCheck(res, "get dominant freq in update()");

	void* specData;
	res = mpRecDSP->getParameterData((int)FMOD_DSP_FFT_SPECTRUMDATA, (void**)&specData, 0, 0, 0);
	FMODErrorCheck(res, "get spectrum data in update()");

	FMOD_DSP_PARAMETER_FFT* fft = (FMOD_DSP_PARAMETER_FFT*)specData;
	if (fft)
		*mRecSpec = (float&)fft->spectrum;

	freq /= 10000;
	mRecFreq = freq;

	res = mpRecSystem->update();
	FMODErrorCheck(res, "update system in update()");

	mpRecChannel->isPlaying(&mIsPlaying);

	return mIsPlaying;
}

Recording::~Recording()
{
	this->clean();
}