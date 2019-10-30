#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

in vec2 oTexCoord;

uniform float uFreq;
uniform float uLastFreq;
uniform float uDeltaFreq;

uniform float uTime;
uniform float uDeltaTime;

uniform vec2 uRes;

uniform float[256] uSpectrum;

out vec4 retColor;

vec3 col(vec2 p)
{
	float f = min(abs(uFreq), abs(uLastFreq)) + abs(uDeltaFreq / 2.0);
	//float ft = smoothstep(sin(uTime), sin(f),  uFreq);
	float fs = sin(uTime + uFreq) / abs(sin(uTime - uLastFreq) / 2.0);
	float fstep = smoothstep(sin(uFreq / f), uFreq + uLastFreq, uTime);

	float r = length(p) * pow(2.0, fstep);// * 0.1);
	float theta = atan(p.x, p.y);

	float s = sin(pow(r, 2.0)) * fs;
	float g = cos(theta) / sin(theta);

	float v = 0.1 / abs(s - g) * f;
	vec3 ret = v / vec3(0.4, 0.2 + sin(uTime) / f, 0.5 + cos(uTime));

	g = sin(theta) / cos(theta);
	v = 0.1 / abs(s - g) * f;
	ret += v / vec3(0.6, 0.8 + sin(uTime) / f, 0.5 + cos(uTime));

	//ret *= fs;
	//ret += sin(fstep);

	//ret += ret;

	ret *= sin(uTime) + f;

	return ret;
}

void main()
{
	vec2 uv = ((gl_FragCoord.xy / uRes.xy) / 2.0 - 0.5);

	vec4 ret;

	ret = vec4(col(sin(uv) * uTime), 1.0);
	retColor = ret;
}