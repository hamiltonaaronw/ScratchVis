#ifndef AUDIO_H
#define AUDIO_H

#include <../../FMOD/FMOD Studio API Windows/api/core/inc/fmod.h>
#include <../../FMOD/FMOD Studio API Windows/api/core/inc/fmod_errors.h>
#include <iostream>
#include <stdio.h>
#include <malloc.h>
#include <stdlib.h>
#include <filesystem>

#include <include/glm/glm/glm.hpp>
#include <sys/types.h>
#include <Windows.h>
#include <vector>
#include "../dirent.h"

struct Song
{
	FMOD_SOUND *mSound;
	std::string mSongName;
	int mOrigIndex;

	Song(std::string s, FMOD_SOUND *m, int i)
		:mSongName(s), 
		mSound(m),
		mOrigIndex(i)
	{}
};

class Audio
{
private:
	void FMODErrorCheck(FMOD_RESULT res);

	FMOD_SYSTEM					*mpSystem;
	FMOD_CHANNELGROUP			*mpCGroup;
	FMOD_CHANNEL				*mpChannel;
	std::vector<Song*>			mSongs;
	FMOD_DSP					*mpDSP;

	int mNumDrivers;
	int mSongCount;
	char mDriverName;

	const int SPEC_SIZE = 256;
	float mFreq;
	float mSpectrum[256];

	int mCurSong;
	bool mIsPlaying;

	void genRandQueue();

	bool mIsRandom;

	std::string mMusicDir;

public:
	Audio();
	void initAudio();
	void loadSongs();
	void playSong();
	void unloadAudio();
	void update();
	void toggleSong(int prevNext);
	void selectSong(int i);

	float getFreq() { return mFreq; };
	float* getSpectrumData() { return mSpectrum; };
	int getNumSongs() { return mSongCount; };
	int getSpecSize() { return SPEC_SIZE; };

	void setIsPlaying(bool b) { mIsPlaying = b; };
	bool getIsPlaying() { return mIsPlaying; };

	void checkEndSong();

	void setIsRandom(bool b) { mIsRandom = b; };
	bool getIsRandom() { return mIsRandom; };
	void toggleRand();

	std::string getCurrentSongName() { return mSongs[mCurSong]->mSongName; };
	std::string getSongName(int i) { return mSongs[i]->mSongName; };

	void setMusicDir(std::string s) { mMusicDir = s; };
	std::string getMusicDir() { return mMusicDir; };
};

#endif
