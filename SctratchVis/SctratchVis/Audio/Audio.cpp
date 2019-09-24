#include "Audio.h"

Audio::Audio()
{
	initAudio();
}


void Audio::FMODErrorCheck(FMOD_RESULT res)
{
	if (res != FMOD_OK)
		std::cout << "FMOD Error! " << FMOD_ErrorString(res) << std::endl;
}

void Audio::initAudio()
{
	mIsPlaying = false;
	FMOD_RESULT res;

	// create system
	res = FMOD_System_Create(&mpSystem);
	FMODErrorCheck(res);

	//initialize the system
	res = FMOD_System_Init(mpSystem, 2, FMOD_INIT_NORMAL, 0);
	FMODErrorCheck(res);

	// get number of sound cards
	res = FMOD_System_GetNumDrivers(mpSystem, &mNumDrivers);
	FMODErrorCheck(res);

	// no sound cards (disable sound)
	if (mNumDrivers == 0)
	{
		res = FMOD_System_SetOutput(mpSystem, FMOD_OUTPUTTYPE_NOSOUND);
		FMODErrorCheck(res);
	}

	// init DSP
	res = FMOD_System_CreateDSPByType(mpSystem, FMOD_DSP_TYPE_FFT, &mpDSP);
	FMODErrorCheck(res);

	// set window size for DSP
	res = FMOD_DSP_SetParameterInt(mpDSP, (int)FMOD_DSP_FFT_WINDOWSIZE, 256);
	FMODErrorCheck(res);

	// set window type for DSP
	res = FMOD_DSP_SetParameterInt(mpDSP, (int)FMOD_DSP_FFT_WINDOWTYPE, (int)FMOD_DSP_FFT_WINDOW_BLACKMANHARRIS);
	FMODErrorCheck(res);

	// create channel group
	res = FMOD_System_CreateChannelGroup(mpSystem, "channel group", &mpCGroup);
	FMODErrorCheck(res);

	// add DSP to channel group
	res = FMOD_ChannelGroup_AddDSP(mpCGroup, FMOD_CHANNELCONTROL_DSP_TAIL, mpDSP);
	FMODErrorCheck(res);

	mFreq = 0.0f;
	mIsRandom = false;
}

void Audio::genRandQueue()
{
	srand((unsigned int)time(0));
	std::random_shuffle(mSongs.begin(), mSongs.end());
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
			if (strstr(dir->d_name, ".mp3"))
			{
				FMOD_SOUND *pTmp;
				strcpy(tmp, musicDir);
				const char *fullDir = strcat(tmp, dir->d_name);

				res = FMOD_System_CreateStream(mpSystem, fullDir, FMOD_DEFAULT, 0, &pTmp);
				FMODErrorCheck(res);

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
		this->setMusicDir("/Music");
		this->loadSongs();
	}

	mSongCount = mSongs.size();
	mCurSong = 0;
}

void Audio::playSong()
{
	FMOD_RESULT res;
	
	res = FMOD_System_PlaySound(mpSystem, mSongs[mCurSong]->mSound, mpCGroup, 0, &mpChannel);
	FMODErrorCheck(res);

	res = FMOD_Channel_SetMode(mpChannel, FMOD_LOOP_OFF);
	FMODErrorCheck(res);

	mIsPlaying = true;
}

void Audio::update()
{
	if (!mIsPlaying)
		return;

	this->checkEndSong();

	if (mCurSong == mSongCount)
		genRandQueue();

	FMOD_RESULT res;
	float freq = 0;

	res = FMOD_DSP_GetParameterFloat(mpDSP, FMOD_DSP_FFT_DOMINANT_FREQ, &freq, 0, 0);
	FMODErrorCheck(res);

	void *specData;
	res = FMOD_DSP_GetParameterData(mpDSP, (int)FMOD_DSP_FFT_SPECTRUMDATA, (void **)&specData, 0, 0, 0);
	FMODErrorCheck(res);

	FMOD_DSP_PARAMETER_FFT* fft = (FMOD_DSP_PARAMETER_FFT *)specData;

	if (fft)
	{
		for (int i = 0; i < fft->length; i++)
			mSpectrum[i] = (float &)fft->spectrum[i];
	}

	freq /= 10000;
	mFreq = freq;

	FMOD_System_Update(mpSystem);
}

void Audio::toggleSong(int prevNext)
{
	FMOD_RESULT res;
	int songToPlay = (mCurSong + prevNext) % mSongCount;

	if (mIsPlaying)
	{
		res = FMOD_Channel_Stop(mpChannel);
		FMODErrorCheck(res);
		mIsPlaying = false;
	}

	res = FMOD_System_PlaySound(mpSystem, mSongs[songToPlay]->mSound, mpCGroup, 0, &mpChannel);
	FMODErrorCheck(res);

	mCurSong = songToPlay;

	res = FMOD_Channel_SetMode(mpChannel, FMOD_LOOP_OFF);
	FMODErrorCheck(res);

	mIsPlaying = true;
}

void Audio::selectSong(int i)
{
	if (!mSongs[i]->mSound)
	{
		std::cout << i <<  "\tInvalid input" << std::endl;
		return;
	}

	FMOD_RESULT res;

	if (mIsPlaying)
	{
		res = FMOD_Channel_Stop(mpChannel);
		FMODErrorCheck(res);
		mIsPlaying = false;
	}

	res = FMOD_System_PlaySound(mpSystem, mSongs[i]->mSound, mpCGroup, 0, &mpChannel);
	mCurSong = i;

	res = FMOD_Channel_SetMode(mpChannel, FMOD_LOOP_OFF);
	FMODErrorCheck(res);

	mIsPlaying = true;
}

void Audio::checkEndSong()
{
	FMOD_BOOL isPlaying;
	if (FMOD_Channel_IsPlaying(mpChannel, &isPlaying) != FMOD_OK)
	{
		std::cout << "song ended" << std::endl;

		mIsPlaying = false;
		toggleSong(1);
	}
}

void Audio::unloadAudio()
{
	FMOD_RESULT res;
	mIsPlaying = false;

	// release DSP
	if (mpDSP)
	{
		// remove DSP from channel
		res = FMOD_Channel_RemoveDSP(mpChannel, mpDSP);
		FMODErrorCheck(res);

		// release DSP
		res = FMOD_DSP_Release(mpDSP);
		FMODErrorCheck(res);
	}

	// stop playing, release channel
	if (mIsPlaying)
	{
		res = FMOD_Channel_Stop(mpChannel);
		FMODErrorCheck(res);

		mIsPlaying = false;
	}

	for (int i = 0; i < (int)mSongs.size(); ++i)
	{
		// release each song
		res = FMOD_Sound_Release(mSongs[i]->mSound);
		FMODErrorCheck(res);
	}

	// clear songs
	mSongs.clear();

	// release channel group
	if (mpCGroup)
	{
		res = FMOD_ChannelGroup_Release(mpCGroup);
		FMODErrorCheck(res);
	}

	// finally, close the system
	res = FMOD_System_Close(mpSystem);
	FMODErrorCheck(res);
}