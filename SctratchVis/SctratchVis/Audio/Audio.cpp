#include "Audio.h"

Audio::Audio()
{
	initAudio();
}

void Audio::FMODErrorCheck(FMOD_RESULT res, std::string call)
{
	if (res != FMOD_OK)
		std::cout << "FMOD Error! " << FMOD_ErrorString(res) << " at function call " << call << std::endl;
}

void Audio::checkEndSong()
{
	//if (FMOD_Channel_IsPlaying(mpChannel, &isPlaying) != FMOD_OK)
	mpChannel->isPlaying(&mIsPlaying);
	if (!mIsPlaying)
	{
		std::cout << "song ended" << std::endl;

		mIsPlaying = false;
	//	toggleSong(1);
	}
}

void Audio::genRandQueue()
{
	std::random_device rd;
	std::mt19937 g(rd());
	srand((unsigned int)time(0));
	std::shuffle(mSongs.begin(), mSongs.end(), g);
}

void Audio::initAudio()
{
	mIsPlaying = false;
	mIsPaused = false;
	FMOD_RESULT res;

	// create system
	//res = FMOD_System_Create(&mpSystem);
	res = FMOD::System_Create(&mpSystem);
	FMODErrorCheck(res, "system create in initAudio()");

	//initialize the system
	//res = FMOD_System_Init(mpSystem, 2, FMOD_INIT_NORMAL, 0);
	res = mpSystem->init(2, FMOD_INIT_NORMAL, 0);
	FMODErrorCheck(res, "system init in initAudio()");

	// get number of sound cards
	//res = FMOD_System_GetNumDrivers(mpSystem, &mNumDrivers);
	res = mpSystem->getNumDrivers(&mNumDrivers);
	FMODErrorCheck(res, "get num drivers in initAudio()");

	// no sound cards (disable sound)
	if (mNumDrivers == 0)
	{ 
		//res = FMOD_System_SetOutput(mpSystem, FMOD_OUTPUTTYPE_NOSOUND);
		res = mpSystem->setOutput(FMOD_OUTPUTTYPE_NOSOUND);
		FMODErrorCheck(res, "set output in initAudio()");
	}

	// init DSP
	//res = FMOD_System_CreateDSPByType(mpSystem, FMOD_DSP_TYPE_FFT, &mpDSP);
	res = mpSystem->createDSPByType(FMOD_DSP_TYPE_FFT, &mpDSP);
	FMODErrorCheck(res, "init dsp in initAudio()");

	// set window size for DSP
	//res = FMOD_DSP_SetParameterInt(mpDSP, (int)FMOD_DSP_FFT_WINDOWSIZE, 256);
	res = mpDSP->setParameterInt((int)FMOD_DSP_FFT_WINDOWSIZE, 256);
	FMODErrorCheck(res, "set dsp window size in initAudio()");

	// set window type for DSP
	//res = FMOD_DSP_SetParameterInt(mpDSP, (int)FMOD_DSP_FFT_WINDOWTYPE, (int)FMOD_DSP_FFT_WINDOW_BLACKMANHARRIS);
	res = mpDSP->setParameterInt((int)FMOD_DSP_FFT_WINDOWTYPE, (int)FMOD_DSP_FFT_WINDOW_BLACKMANHARRIS);
	FMODErrorCheck(res, "set dsp window type in initAudio()");

	// create channel group
	//res = FMOD_System_CreateChannelGroup(mpSystem, "channel group", &mpCGroup);
	res = mpSystem->createChannelGroup("Channel group", &mpCGroup);
	FMODErrorCheck(res, "create channel group in initAudio()");

	// add DSP to channel group
	//res = FMOD_ChannelGroup_AddDSP(mpCGroup, FMOD_CHANNELCONTROL_DSP_TAIL, mpDSP);
	res = mpCGroup->addDSP(FMOD_CHANNELCONTROL_DSP_TAIL, mpDSP);
	FMODErrorCheck(res, "add dsp to channel group in initAudio()");

	mFreq = 0.0f;
	mIsRandom = false;
}

void Audio::loadSongs()
{
	DIR *d;
	struct dirent *dir;
	const char* musicDir = mMusicDir.c_str();

	if (opendir(musicDir) == NULL)
	{
		std::cout << "Invalid directory. Using default music directory\n";
		musicDir = "Music/";
		setMusicDir(musicDir);
	}

	d = opendir(musicDir);

	char tmp[512];

	FMOD_RESULT res;

	int i = 0;

	if (d != NULL)
	{
		// initialize mpSongs
		d = opendir(musicDir);
		while ((dir = readdir(d)) != NULL)
		{
			if (strstr(dir->d_name, ".mp3") || strstr(dir->d_name, ".wav"))
			{
				FMOD::Sound *pTmp;
				strcpy(tmp, musicDir);
				const char *fullDir = strcat(tmp, dir->d_name);

				//res = FMOD_System_CreateStream(mpSystem, fullDir, FMOD_DEFAULT, 0, &pTmp);
				res = mpSystem->createStream(fullDir, FMOD_DEFAULT, 0, &pTmp);
				std::string call = "create stream for ";
				FMODErrorCheck(res, call.append(dir->d_name));

				std::string n = dir->d_name;
				n = n.substr(0, n.length() - 4);

				mSongs.push_back(new Song(n, pTmp, i));

				i++;

				strcat(tmp, " ");
			}
		}
		closedir(d);
	}
	else
		perror("Couldn't open the directory");

	if (i == 0)
	{
		std::cout << "No .mp3 files found. Using default music directory\n";
		this->setMusicDir("Music/");
		this->loadSongs();
	}

	mSongCount = mSongs.size();
	mCurSong = 0;
}

void Audio::playSong()
{
	FMOD_RESULT res;

	//res = FMOD_System_PlaySound(mpSystem, mSongs[mCurSong]->mSound, mpCGroup, 0, &mpChannel);
	res = mpSystem->playSound(mSongs[mCurSong]->mSound, mpCGroup, mIsPaused, &mpChannel);
	FMODErrorCheck(res, "play sound in playSong()");

	//res = FMOD_Channel_SetMode(mpChannel, FMOD_LOOP_OFF);
	res = mpChannel->setMode(FMOD_LOOP_OFF);
	FMODErrorCheck(res, "set channe lmode in playSong()");

	mIsPlaying = true;
}


void Audio::selectSong(int i)
{
	if (!mSongs[i]->mSound)
	{
		std::cout << i << "\tInvalid input" << std::endl;
		return;
	}

	FMOD_RESULT res;

	if (mIsPlaying)
	{
		//res = FMOD_Channel_Stop(mpChannel);
		res = mpChannel->stop();
		FMODErrorCheck(res, "stop channel in selectSong()");
		mIsPlaying = false;
	}

	//res = FMOD_System_PlaySound(mpSystem, mSongs[i]->mSound, mpCGroup, 0, &mpChannel);
	res = mpSystem->playSound(mSongs[i]->mSound, mpCGroup, 0, &mpChannel);
	FMODErrorCheck(res, "play sound in selectSong()");
	mCurSong = i;

	//res = FMOD_Channel_SetMode(mpChannel, FMOD_LOOP_OFF);
	res = mpChannel->setMode(FMOD_LOOP_OFF);
	FMODErrorCheck(res, "set channel mode in selectSong()");

	mIsPlaying = true;
}

void Audio::togglePause()
{
	FMOD_RESULT res;

	//res = FMOD_Channel_SetPaused(mpChannel, !mIsPaused);
	res = mpChannel->setPaused(!mIsPaused);
	FMODErrorCheck(res, "set pause in togglePause()");

	this->setIsPaused(!mIsPaused);
}

void Audio::toggleRand()
{
	std::vector<Song *> tmpSongs = mSongs;
	switch (mIsRandom)
	{
	case true:
		for (int i = 0; i < mSongCount; i++)
		{
			for (int j = 0; j < mSongCount; j++)
			{
				if (tmpSongs[j]->mOrigIndex == i)
					mSongs[i] = tmpSongs[j];
			}
		}

		mIsRandom = false;
		break;

	case false:
		genRandQueue();
		mIsRandom = true;
		break;
	}

	tmpSongs.clear();
}

void Audio::toggleSong(int prevNext)
{
	FMOD_RESULT res;
	int i = (mCurSong + prevNext);
	int songToPlay = (i < 0) ? mSongCount - 1 : i % mSongCount;

	if (mIsPlaying)
	{
		//res = FMOD_Channel_Stop(mpChannel);
		res = mpChannel->stop();
		FMODErrorCheck(res, "stop channel in toggleSong()");
		mIsPlaying = false;
	}

	//res = FMOD_System_PlaySound(mpSystem, mSongs[songToPlay]->mSound, mpCGroup, 0, &mpChannel);
	res = mpSystem->playSound(mSongs[songToPlay]->mSound, mpCGroup, 0, &mpChannel);
	FMODErrorCheck(res, "play sound in toggleSong()");

	mCurSong = songToPlay;

	//res = FMOD_Channel_SetMode(mpChannel, FMOD_LOOP_OFF);
	res = mpChannel->setMode(FMOD_LOOP_OFF);
	FMODErrorCheck(res, "set channel mode in toggleSong()");

	//res = FMOD_Channel_SetPaused(mpChannel, mIsPaused);
	res = mpChannel->setPaused(mIsPaused);
	FMODErrorCheck(res, "set pause in toggleSong()");

	mIsPlaying = true;
}

void Audio::unloadAudio()
{
	FMOD_RESULT res;
	mIsPlaying = false;

	// release DSP
	if (mpDSP)
	{
		// remove DSP from channel
		//res = FMOD_Channel_RemoveDSP(mpChannel, mpDSP);
		res = mpChannel->removeDSP(mpDSP);
		FMODErrorCheck(res, "remove dsp in unloadAudio()");

		// release DSP
		//res = FMOD_DSP_Release(mpDSP);
		res = mpDSP->release();
		FMODErrorCheck(res, "release dsp in unloadAudio()");
	}

	// stop playing, release channel
	if (mIsPlaying)
	{
		//res = FMOD_Channel_Stop(mpChannel);
		res = mpChannel->stop();
		FMODErrorCheck(res, "stop channel in unloadAudio()");

		mIsPlaying = false;
	}

	for (int i = 0; i < (int)mSongs.size(); ++i)
	{
		// release each song
		//res = FMOD_Sound_Release(mSongs[i]->mSound);
		res = mSongs[i]->mSound->release();
		FMODErrorCheck(res, "release song " + mSongs[i]->mSongName + "in unloadAudio()");
	}

	// clear songs
	mSongs.clear();

	// release channel group
	if (mpCGroup)
	{
		//res = FMOD_ChannelGroup_Release(mpCGroup);
		res = mpCGroup->release();
		FMODErrorCheck(res, "release channel group in unloadAudio()");
	}

	// release the system
	res = mpSystem->release();
	FMODErrorCheck(res, "release system in unloadAudio()");

	// finally, close the system
	//res = FMOD_System_Close(mpSystem);
	res = mpSystem->close();
	FMODErrorCheck(res, "close system in unloadAudio()");
}

bool Audio::update()
{
	if (!mIsPlaying)
		return false;

	this->checkEndSong();

	if (mIsRandom && mCurSong == mSongCount)
		genRandQueue();

	FMOD_RESULT res;
	float freq = 0;

	//res = FMOD_DSP_GetParameterFloat(mpDSP, FMOD_DSP_FFT_DOMINANT_FREQ, &freq, 0, 0);
	res = mpDSP->getParameterFloat(FMOD_DSP_FFT_DOMINANT_FREQ, &freq, 0, 0);
	FMODErrorCheck(res, "get dominant freq in update()");

	void *specData;
	//res = FMOD_DSP_GetParameterData(mpDSP, (int)FMOD_DSP_FFT_SPECTRUMDATA, (void **)&specData, 0, 0, 0);
	res = mpDSP->getParameterData((int)FMOD_DSP_FFT_SPECTRUMDATA, (void**)&specData, 0, 0, 0);
	FMODErrorCheck(res, "get spectrum data in update()");

	FMOD_DSP_PARAMETER_FFT* fft = (FMOD_DSP_PARAMETER_FFT *)specData;

	if (fft)
	{
		for (int i = 0; i < fft->length; i++)
			mSpectrum[i] = (float &)fft->spectrum[i];
	}

	freq /= 10000;
	mFreq = freq;

	//FMOD_System_Update(mpSystem);
	res = mpSystem->update();
	FMODErrorCheck(res, "update system in update()");

	return true;
}

Audio::~Audio()
{
	this->unloadAudio();
}