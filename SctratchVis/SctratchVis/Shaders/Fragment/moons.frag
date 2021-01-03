#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

out vec4 retColor;

uniform float uFreq;
uniform float uTime;
uniform float uLastFreq;
uniform float uDeltaFreq;
uniform vec2 uRes;

float sinc(float x)
{
	return sin(x) / x;
}

float cosc(float x)
{
	return cos(x) / x;
}

mat2 rot(float a)
{
	mat2 ret = mat2(
		cos(a), sin(a),
		-sin(a), cos(a)
	);

	return ret;
}

vec3 col(vec2 p)
{
	//vec2 po = (gl_FragCoord.xy / uRes.xy);
	vec3 ret;
	float c = 0.0;

	float t = uTime * sin(uFreq);
	float f = abs(uFreq + uLastFreq * sinc(t)) * 0.5;
	float ff = fract(f * 10.0);
	ff = abs(abs(ff - f) - uLastFreq) - (t * 0.2) * 0.05;
	//float ff = fract(fract(f * 100.0) + fract(f * 10.0)) + (fract(f / f) * 10.0); 
	float fs = sin(uTime + uFreq) / abs(sin(uTime - uLastFreq) / 2.0);
	float fstep = smoothstep(sin(uFreq / f), uFreq + uLastFreq, uTime);
	float tf = smoothstep(sinc(f), 2.0, uTime);
	t *= sin(cosc(tf));
	t *= abs(sin(uTime) + ff);

	c += sin(p.x * cos(t / 15.0) * 40.0 + (fract(uFreq * 100.0) * 10.0)) + cos(p.y * cos(t / 15.0) * 10.0);

	c += sin(p.y * sin(t / c) * c) + cos(p.y * sin(uTime / 15.0) * 10.0);

	c += sin(p.x * sin(t / c) * c) + cos(p.y * sin(uTime / 15.0) * 10.0);

    c *= 1.0 / fract(sinc(uTime / 10.0) * 100.0) * sinc(f);
    //c *= sinc(uTime / 10.0) * uFreq;

	ret = vec3(c, c * cosc(c - uTime), sin(c) * c);

	return ret;
}

void main() 
{
	vec2 uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) * 2.0;
	vec4 ret;

	ret = vec4(col(uv), 1.0);
	retColor = ret;

}