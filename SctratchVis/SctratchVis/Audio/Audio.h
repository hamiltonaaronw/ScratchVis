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

static const int MAX_DRIVERS = 16;
static const int MAX_DRIVERS_IN_VIEW = 3;

struct RECORD_STATE
{
	FMOD::Sound* sound;
	FMOD::Channel* channel;
};

//FMOD_RESULT F_CALLBACK SystemCallback2(FMOD_SYSTEM* /*system*/, FMOD_SYSTEM_CALLBACK_TYPE /*type*/, void*, void*, void* userData)
//{
//	int* recordListChangedCount = (int*)userData;
//	*recordListChangedCount = *recordListChangedCount + 1;
//
//	return FMOD_OK;
//}

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
protected:
	void FMODErrorCheck(FMOD_RESULT res, std::string call);

private:
	// functions
	
	void genRandQueue();

	// variables
	bool mIsPaused;
	bool mIsRandom;

	FMOD::ChannelGroup			*mpCGroup;
	FMOD::Channel				*mpChannel;
	FMOD::DSP					*mpDSP;
	FMOD::System				*mpSystem;
	FMOD::Sound					*mpSound;

	std::vector<Song*>			mSongs;

	char mDriverName;
	int mNumDrivers;
	int mSongCount;

	const int SPEC_SIZE = 256;
	int mCurSong;

	unsigned int mSamplesRecorded = 0;
	unsigned int mSamplesPlayed = 0;
	void* mExtraDriverData;
	int mNativeRate;
	int mNativeChannels;
	unsigned int mDriftThreshold;
	unsigned int mDesiredLatency;
	unsigned int mAdjustedLatency;
	int mActualLatency;
	FMOD_CREATESOUNDEXINFO mExinfo;
	unsigned int mSoundLength;
	RECORD_STATE record[MAX_DRIVERS] = {};
	int mNumConnectedDrivers;
	int mCursor;
	int mScroll;

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
	void updateRecord();
	void updateRecord2();

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

