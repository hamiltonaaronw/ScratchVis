#pragma once

#include <../../FMOD/FMOD Studio API Windows/api/core/inc/fmod.h>
#include <../../FMOD/FMOD Studio API Windows/api/core/inc/fmod.hpp>
#include <../../FMOD/FMOD Studio API Windows/api/core/inc/fmod_common.h>
#include <../../FMOD/FMOD Studio API Windows/api/core/inc/fmod_errors.h>
#include "../dirent.h"

#include <iostream>
#include <stdio.h>
#include <stdlib.h>
#include <random>
#include <sys/types.h>
#include <Windows.h>
#include <vector>
#include <time.h>

struct Song
{
	FMOD::Sound *mSound;
	std::string mSongName;
	int mOrigIndex;

	Song(std::string s, FMOD::Sound *m, int i)
		:mSongName(s), 
		mSound(m),
		mOrigIndex(i)
	{}
};

class Audio
{
private:
	// functions
	void FMODErrorCheck(FMOD_RESULT res, std::string call);
	void genRandQueue();

	// variables
	bool mIsPaused;
	bool mIsRandom;

	FMOD::ChannelGroup			*mpCGroup;
	FMOD::Channel				*mpChannel;
	FMOD::DSP					*mpDSP;
	FMOD::System				*mpSystem;

	std::vector<Song*>			mSongs;

	char mDriverName;
	int mNumDrivers;
	int mSongCount;

	const int SPEC_SIZE = 256;
	int mCurSong;

	float mFreq;
	float mSpectrum[256];

	bool mIsPlaying;

	std::string mMusicDir;

public:

	// Constructor
	Audio();
	~Audio();

	// functions
	void checkEndSong();
	void initAudio();
	void loadSongs();
	void playSong();
	void selectSong(int i);
	void togglePause();
	void toggleRand();
	void toggleSong(int prevNext);
	void unloadAudio();
	bool update();

	// getters/setters
	float getFreq() { return mFreq; };
	float* getSpectrumData() { return mSpectrum; };

	int getNumSongs() { return mSongCount; };
	int getSpecSize() { return SPEC_SIZE; };

	void setIsPlaying(bool b) { mIsPlaying = b; };
	bool getIsPlaying() { return mIsPlaying; };

	void setIsRandom(bool b) { mIsRandom = b; };
	bool getIsRandom() { return mIsRandom; };

	void setIsPaused(bool b) { mIsPaused = b; };
	bool getIsPaused() { return mIsPaused; };

	std::string getCurrentSongName() { return mSongs[mCurSong]->mSongName; };
	std::string getSongName(int i) { return mSongs[i]->mSongName; };

	void setMusicDir(std::string s) { mMusicDir = s; };
	std::string getMusicDir() { return mMusicDir; };
};

